// API to withdraw an offer (helper can withdraw before acceptance)
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/mailer";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type WithdrawBody = {
  fulfillmentId?: string;
  reason?: string;
};

async function handleWithdrawOffer(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { fulfillmentId, reason } = (req.body || {}) as WithdrawBody;
    if (!fulfillmentId) return res.status(400).json({ error: "fulfillmentId is required" });

    const admin = getAdminSupabaseClient();
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: "Invalid or expired token" });

    // Get fulfillment with need and helper info
    const { data: fulfillment, error: fulfillmentErr } = await admin
      .from("fulfillment")
      .select(`
        id, status, need_id, helper_id, message,
        needs(id, title, owner_id, contact_email)
      `)
      .eq("id", fulfillmentId)
      .maybeSingle();

    if (fulfillmentErr || !fulfillment) {
      return res.status(404).json({ error: "Fulfillment not found" });
    }

    // Only helper can withdraw their own offer
    if (fulfillment.helper_id !== user.id) {
      return res.status(403).json({ error: "Not authorized to withdraw this offer" });
    }

    // Can only withdraw proposed offers
    if (fulfillment.status !== 'proposed') {
      return res.status(400).json({ error: `Cannot withdraw ${fulfillment.status} offers. Only proposed offers can be withdrawn.` });
    }

    // Update fulfillment status to withdrawn
    const updateData: any = { 
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString()
    };

    if (reason) {
      updateData.message = `${fulfillment.message || ''}\n\nHelper withdrew: ${reason}`.trim();
    }

    const { error: updateErr } = await admin
      .from("fulfillment")
      .update(updateData)
      .eq("id", fulfillmentId);

    if (updateErr) {
      logger.error("Update error:", updateErr);
      return res.status(500).json({ error: "Could not withdraw fulfillment" });
    }

    // Check if this was the only active offer for the need
    const { data: otherOffers, error: checkError } = await admin
      .from("fulfillment")
      .select("id")
      .eq("need_id", fulfillment.need_id)
      .in("status", ["proposed", "accepted"]);

    if (!checkError && (!otherOffers || otherOffers.length === 0)) {
      // No other active offers, revert need status to 'new' if it was 'Help Offered'
      const { data: need } = await admin
        .from("needs")
        .select("status")
        .eq("id", fulfillment.need_id)
        .single();

      if (need && need.status === 'Help Offered') {
        await admin
          .from("needs")
          .update({ status: 'new' })
          .eq("id", fulfillment.need_id);
      }
    }

    // Get requester email to notify them
    const { data: requester } = await admin.auth.admin.getUserById((fulfillment.needs as any)?.owner_id);
    
    if (requester.user?.email) {
      try {
        const emailText = `An offer for "${(fulfillment.needs as any)?.title}" has been withdrawn by the helper.

${reason ? `Reason provided: ${reason}\n` : ''}
You can still receive other offers for this need. Thank you for using 4MK!`;

        await sendEmail({
          to: requester.user.email,
          subject: `Offer withdrawn for "${(fulfillment.needs as any)?.title}" - 4MK`,
          text: emailText,
        });
        
        logger.debug("Withdrawal notification sent to requester:", requester.user.email);
      } catch (emailErr) {
        logger.error("Email send failed:", emailErr);
        // Non-fatal error - don't fail the API call
      }
    }

    return res.status(200).json({ ok: true, status: 'withdrawn' });
  } catch (e: any) {
    logger.error("Error in /api/offers/withdraw:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Validation rules
const validationRules = [
  { field: 'fulfillmentId', required: true, type: 'string' as const },
  { field: 'reason', required: false, type: 'string' as const, maxLength: 500 }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 20 }), // 20 withdrawals per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleWithdrawOffer(req, res);
  } catch (error) {
    logger.error('Withdraw offer API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}




