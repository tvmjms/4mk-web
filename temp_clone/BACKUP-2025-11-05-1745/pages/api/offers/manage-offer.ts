// API to accept or decline fulfillment offers
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/mailer";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type OfferActionBody = {
  fulfillmentId?: string;
  action?: 'accept' | 'decline';
  reason?: string;
};

async function handleOfferAction(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { fulfillmentId, action, reason } = (req.body || {}) as OfferActionBody;
    if (!fulfillmentId || !action) {
      return res.status(400).json({ error: "fulfillmentId and action are required" });
    }

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

    // Only need owner can accept/decline
    if ((fulfillment.needs as any)?.owner_id !== user.id) {
      return res.status(403).json({ error: "Not authorized to modify this offer" });
    }

    // Can only accept/decline proposed offers
    if (fulfillment.status !== 'proposed') {
      return res.status(400).json({ error: `Cannot ${action} ${fulfillment.status} offers` });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const updateData: any = { 
      status: newStatus,
    };

    if (action === 'accept') {
      updateData.accepted_at = new Date().toISOString();
    }

    if (reason) {
      updateData.message = `${fulfillment.message}\n\nRequester ${action}ed: ${reason}`;
    }

    // Update fulfillment status
    const { error: updateErr } = await admin
      .from("fulfillment")
      .update(updateData)
      .eq("id", fulfillmentId);

    if (updateErr) {
      logger.error("Update error:", updateErr);
      return res.status(500).json({ error: "Could not update fulfillment" });
    }

    // If accepted, also update need status
    if (action === 'accept') {
      const { error: needUpdateErr } = await admin
        .from("needs")
        .update({ status: "accepted" })
        .eq("id", fulfillment.need_id);

      if (needUpdateErr) {
        logger.error("Need update error:", needUpdateErr);
        // Non-fatal - fulfillment is still accepted
      }
    }

    // Get helper email to notify them
    const { data: helper } = await admin.auth.admin.getUserById(fulfillment.helper_id);
    
    if (helper.user?.email) {
      try {
        const subject = action === 'accept' 
          ? `Your offer for "${(fulfillment.needs as any)?.title}" was accepted! - 4MK`
          : `Update on your offer for "${(fulfillment.needs as any)?.title}" - 4MK`;

        const emailText = action === 'accept'
          ? `Great news! Your offer to help with "${(fulfillment.needs as any)?.title}" has been accepted!

${reason ? `Requester's message: ${reason}\n` : ''}
You can now coordinate directly via email to share codes, pickup details, or arrangements.

When the help is completed, the requester will mark it as fulfilled in the system.

Thank you for helping your community through 4MK!`
          : `Your offer to help with "${(fulfillment.needs as any)?.title}" was declined.

${reason ? `Reason: ${reason}\n` : ''}
Thank you for your willingness to help! There are many other opportunities to make a difference in your community.

Keep helping through 4MK!`;

        await sendEmail({
          to: helper.user.email,
          subject,
          text: emailText,
        });
        
        logger.debug(`${action} notification sent to helper:`, helper.user.email);
      } catch (emailErr) {
        logger.error("Email send failed:", emailErr);
        // Non-fatal error - don't fail the API call
      }
    }

    return res.status(200).json({ ok: true, status: newStatus });
  } catch (e: any) {
    logger.error("Error in /api/offers/manage-offer:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Validation rules
const validationRules = [
  { field: 'fulfillmentId', required: true, type: 'string' as const },
  { field: 'action', required: true, type: 'string' as const },
  { field: 'reason', required: false, type: 'string' as const, maxLength: 200 }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 20 }), // 20 actions per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleOfferAction(req, res);
  } catch (error) {
    logger.error('Manage offer API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}