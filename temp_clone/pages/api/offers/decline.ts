// Decline offer API endpoint
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/mailer";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type DeclineBody = {
  fulfillmentId?: string;
  reason?: string;
};

async function handleDeclineOffer(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { fulfillmentId, reason } = (req.body || {}) as DeclineBody;
    if (!fulfillmentId) return res.status(400).json({ error: "fulfillmentId is required" });

    const admin = getAdminSupabaseClient();

    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: "Invalid or expired token" });

    // Get fulfillment with need and helper info
    const { data: fulfillment, error: fulfillmentErr } = await admin
      .from("fulfillment")
      .select(`
        id, status, need_id, helper_id,
        needs(id, title, owner_id, contact_email)
      `)
      .eq("id", fulfillmentId)
      .maybeSingle();

    if (fulfillmentErr || !fulfillment) {
      return res.status(404).json({ error: "Fulfillment not found" });
    }

    // Only need owner can decline
    if ((fulfillment.needs as any)?.owner_id !== user.id) {
      return res.status(403).json({ error: "Not authorized to decline this offer" });
    }

    // Can only decline proposed offers
    if (fulfillment.status !== 'proposed') {
      return res.status(400).json({ error: "Can only decline proposed offers" });
    }

    // Update fulfillment status to declined
    const { error: updateErr } = await admin
      .from("fulfillment")
      .update({ 
        status: "declined",
        message: reason ? `Declined: ${reason}` : 'Declined'
      })
      .eq("id", fulfillmentId);

    if (updateErr) {
      logger.error("Update error:", updateErr);
      return res.status(500).json({ error: "Could not decline fulfillment" });
    }

    // Get helper email to notify them
    const { data: helper } = await admin.auth.admin.getUserById(fulfillment.helper_id);
    
    if (helper.user?.email) {
      try {
        await sendEmail({
          to: helper.user.email,
          subject: `Your offer for "${(fulfillment.needs as any)?.title}" was declined`,
          text: `Hello, your offer to help with "${(fulfillment.needs as any)?.title}" was declined. ${reason ? `Reason: ${reason}` : ''} Thank you for your willingness to help!`,
        });
        logger.debug("Decline notification sent to", helper.user.email);
      } catch (emailErr) {
        logger.error("Email send failed:", emailErr);
        // Non-fatal error - don't fail the API call
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    logger.error("Error in /api/offers/decline:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Validation rules for declining offers
const validationRules = [
  { field: 'fulfillmentId', required: true, type: 'string' as const },
  { field: 'reason', required: false, type: 'string' as const, maxLength: 200 }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 20 }), // 20 declines per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleDeclineOffer(req, res);
  } catch (error) {
    logger.error('Decline offer API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}