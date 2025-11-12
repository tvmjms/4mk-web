// API to accept or decline fulfillment offers
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/mailer";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type OfferActionBody = {
  fulfillmentId?: string;
  action?: 'accept' | 'decline' | 'clarify' | 'resume';
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

    // Handle different actions with different authorization
    let newStatus: string;
    let updateData: any = {};
    let canPerformAction = false;

    if (action === 'accept' || action === 'decline') {
      // Only need owner can accept/decline
      if ((fulfillment.needs as any)?.owner_id !== user.id) {
        return res.status(403).json({ error: "Not authorized to modify this offer" });
      }
      // Can only accept/decline proposed offers
      if (fulfillment.status !== 'proposed') {
        return res.status(400).json({ error: `Cannot ${action} ${fulfillment.status} offers` });
      }
      newStatus = action === 'accept' ? 'accepted' : 'declined';
      if (action === 'accept') {
        updateData.accepted_at = new Date().toISOString();
      }
      if (reason) {
        updateData.message = `${fulfillment.message || ''}\n\nRequester ${action}ed: ${reason}`.trim();
      }
      canPerformAction = true;
    } else if (action === 'clarify') {
      // Both requester and helper can set to clarifying
      const isRequester = (fulfillment.needs as any)?.owner_id === user.id;
      const isHelper = fulfillment.helper_id === user.id;
      if (!isRequester && !isHelper) {
        return res.status(403).json({ error: "Not authorized to modify this offer" });
      }
      // Can only clarify accepted offers
      if (fulfillment.status !== 'accepted') {
        return res.status(400).json({ error: `Cannot clarify ${fulfillment.status} offers. Only accepted offers can be set to clarifying.` });
      }
      newStatus = 'clarifying';
      if (reason) {
        const role = isRequester ? 'Requester' : 'Helper';
        updateData.message = `${fulfillment.message || ''}\n\n${role} marked as clarifying: ${reason}`.trim();
      }
      canPerformAction = true;
    } else if (action === 'resume') {
      // Both requester and helper can resume from clarifying
      const isRequester = (fulfillment.needs as any)?.owner_id === user.id;
      const isHelper = fulfillment.helper_id === user.id;
      if (!isRequester && !isHelper) {
        return res.status(403).json({ error: "Not authorized to modify this offer" });
      }
      // Can only resume from clarifying status
      if (fulfillment.status !== 'clarifying') {
        return res.status(400).json({ error: `Cannot resume ${fulfillment.status} offers. Only clarifying offers can be resumed.` });
      }
      newStatus = 'accepted';
      if (reason) {
        const role = isRequester ? 'Requester' : 'Helper';
        updateData.message = `${fulfillment.message || ''}\n\n${role} resumed: ${reason}`.trim();
      }
      canPerformAction = true;
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (!canPerformAction) {
      return res.status(400).json({ error: "Cannot perform this action" });
    }

    updateData.status = newStatus;

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
        .update({ status: "Help Accepted" })
        .eq("id", fulfillment.need_id);

      if (needUpdateErr) {
        logger.error("Need update error:", needUpdateErr);
        // Non-fatal - fulfillment is still accepted
      }
    }

    // Send notifications based on action
    const { data: helper } = await admin.auth.admin.getUserById(fulfillment.helper_id);
    const { data: requester } = await admin.auth.admin.getUserById((fulfillment.needs as any)?.owner_id);
    
    if (action === 'accept' || action === 'decline') {
      // Notify helper
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
        }
      }
    } else if (action === 'clarify' || action === 'resume') {
      // Notify both parties
      const isRequesterAction = (fulfillment.needs as any)?.owner_id === user.id;
      const otherParty = isRequesterAction ? helper : requester;
      
      if (otherParty?.user?.email) {
        try {
          const subject = action === 'clarify'
            ? `Clarification needed for "${(fulfillment.needs as any)?.title}" - 4MK`
            : `Offer resumed for "${(fulfillment.needs as any)?.title}" - 4MK`;

          const emailText = action === 'clarify'
            ? `The offer for "${(fulfillment.needs as any)?.title}" has been marked as needing clarification.

${reason ? `Message: ${reason}\n` : ''}
Please check the platform to respond to questions or provide additional information.

Thank you for using 4MK!`
            : `The offer for "${(fulfillment.needs as any)?.title}" has been resumed after clarification.

${reason ? `Message: ${reason}\n` : ''}
You can continue coordinating through the platform.

Thank you for using 4MK!`;

          await sendEmail({
            to: otherParty.user.email,
            subject,
            text: emailText,
          });
        } catch (emailErr) {
          logger.error("Email send failed:", emailErr);
        }
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
  { field: 'reason', required: false, type: 'string' as const, maxLength: 500 }
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