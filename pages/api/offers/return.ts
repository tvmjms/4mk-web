// API to initiate or complete return/correction process
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/mailer";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type ReturnBody = {
  fulfillmentId?: string;
  action?: 'initiate' | 'complete';
  reason?: string;
  returnType?: 'void' | 'reassign' | 'cancel' | 'refund' | 'intercept' | 'non_reversible';
};

async function handleReturnOffer(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { fulfillmentId, action, reason, returnType } = (req.body || {}) as ReturnBody;
    if (!fulfillmentId || !action) {
      return res.status(400).json({ error: "fulfillmentId and action are required" });
    }

    const admin = getAdminSupabaseClient();
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: "Invalid or expired token" });

    // Get fulfillment with need, helper info, and offer_type
    const { data: fulfillment, error: fulfillmentErr } = await admin
      .from("fulfillment")
      .select(`
        id, status, need_id, helper_id, message, offer_type,
        needs(id, title, owner_id, contact_email)
      `)
      .eq("id", fulfillmentId)
      .maybeSingle();

    if (fulfillmentErr || !fulfillment) {
      return res.status(404).json({ error: "Fulfillment not found" });
    }

    // Only need owner can initiate/complete returns
    if ((fulfillment.needs as any)?.owner_id !== user.id) {
      return res.status(403).json({ error: "Not authorized to return this offer" });
    }

    if (action === 'initiate') {
      // Can only initiate return on fulfilled offers
      if (fulfillment.status !== 'fulfilled') {
        return res.status(400).json({ error: "Can only initiate return on fulfilled offers" });
      }

      // Determine if return is reversible based on offer_type
      const offerType = fulfillment.offer_type || 'general';
      let isNonReversible = false;
      let finalStatus = 'return_initiated';

      // Handle return based on offer type per spec
      if (offerType === 'utility' || offerType === 'shelter_credit') {
        isNonReversible = true;
        finalStatus = 'non_reversible';
      } else if (offerType === 'digital_service' || offerType === 'store_pickup') {
        // These can be returned (void/reassign/cancel)
        finalStatus = 'return_initiated';
      } else if (offerType === 'general') {
        // Check if cashless amount exists and if it's pending
        // For now, assume reversible if no special handling
        finalStatus = 'return_initiated';
      }

      const updateData: any = {
        status: finalStatus,
        return_reason: reason || null,
        return_initiated_at: new Date().toISOString(),
        is_non_reversible: isNonReversible
      };

      const { error: updateErr } = await admin
        .from("fulfillment")
        .update(updateData)
        .eq("id", fulfillmentId);

      if (updateErr) {
        logger.error("Update error:", updateErr);
        return res.status(500).json({ error: "Could not initiate return" });
      }

      // Notify helper
      const { data: helper } = await admin.auth.admin.getUserById(fulfillment.helper_id);
      if (helper.user?.email) {
        try {
          const emailText = `A return has been initiated for your help with "${(fulfillment.needs as any)?.title}".

${reason ? `Reason: ${reason}\n` : ''}
${isNonReversible ? 'Note: This return is marked as non-reversible due to the type of help provided.\n' : ''}
Thank you for helping through 4MK!`;

          await sendEmail({
            to: helper.user.email,
            subject: `Return initiated for "${(fulfillment.needs as any)?.title}" - 4MK`,
            text: emailText,
          });
        } catch (emailErr) {
          logger.error("Email send failed:", emailErr);
        }
      }

      return res.status(200).json({ ok: true, status: finalStatus, isNonReversible });

    } else if (action === 'complete') {
      // Can only complete return on return_initiated status
      if (fulfillment.status !== 'return_initiated') {
        return res.status(400).json({ error: "Can only complete return on return_initiated offers" });
      }

      const updateData: any = {
        status: 'returned',
        returned_at: new Date().toISOString()
      };

      if (reason) {
        updateData.return_reason = `${fulfillment.return_reason || ''}\n\nCompleted: ${reason}`.trim();
      }

      const { error: updateErr } = await admin
        .from("fulfillment")
        .update(updateData)
        .eq("id", fulfillmentId);

      if (updateErr) {
        logger.error("Update error:", updateErr);
        return res.status(500).json({ error: "Could not complete return" });
      }

      // Notify helper
      const { data: helper } = await admin.auth.admin.getUserById(fulfillment.helper_id);
      if (helper.user?.email) {
        try {
          const emailText = `The return for your help with "${(fulfillment.needs as any)?.title}" has been completed.

${reason ? `Additional notes: ${reason}\n` : ''}
Thank you for your understanding and for helping through 4MK!`;

          await sendEmail({
            to: helper.user.email,
            subject: `Return completed for "${(fulfillment.needs as any)?.title}" - 4MK`,
            text: emailText,
          });
        } catch (emailErr) {
          logger.error("Email send failed:", emailErr);
        }
      }

      return res.status(200).json({ ok: true, status: 'returned' });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (e: any) {
    logger.error("Error in /api/offers/return:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Validation rules
const validationRules = [
  { field: 'fulfillmentId', required: true, type: 'string' as const },
  { field: 'action', required: true, type: 'string' as const },
  { field: 'reason', required: false, type: 'string' as const, maxLength: 1000 },
  { field: 'returnType', required: false, type: 'string' as const }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 20 }),
      validateInput(validationRules)
    )(req, res);
    
    return await handleReturnOffer(req, res);
  } catch (error) {
    logger.error('Return offer API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}




