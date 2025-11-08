// Mark offer as completed
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/mailer";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type CompleteBody = {
  fulfillmentId?: string;
  feedback?: string;
  rating?: number;
};

async function handleCompleteOffer(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { fulfillmentId, feedback, rating } = (req.body || {}) as CompleteBody;
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

    // Only need owner can mark as completed
    if ((fulfillment.needs as any)?.owner_id !== user.id) {
      return res.status(403).json({ error: "Not authorized to complete this offer" });
    }

    // Can only complete accepted offers
    if (fulfillment.status !== 'accepted') {
      return res.status(400).json({ error: "Can only complete accepted offers" });
    }

    // Update fulfillment status to completed
    const updateData: any = { 
      status: "fulfilled",
      completed_at: new Date().toISOString()
    };

    if (feedback) updateData.message = feedback;

    const { error: updateErr } = await admin
      .from("fulfillment")
      .update(updateData)
      .eq("id", fulfillmentId);

    if (updateErr) {
      logger.error("Update error:", updateErr);
      return res.status(500).json({ error: "Could not complete fulfillment" });
    }

    // Also update the need status to fulfilled
    const { error: needUpdateErr } = await admin
      .from("needs")
      .update({ 
        status: "fulfilled",
        fulfilled_at: new Date().toISOString()
      })
      .eq("id", fulfillment.need_id);

    if (needUpdateErr) {
      logger.error("Need update error:", needUpdateErr);
      // Non-fatal - fulfillment is still marked as complete
    }

    // Get helper email to notify them
    const { data: helper } = await admin.auth.admin.getUserById(fulfillment.helper_id);
    
    if (helper.user?.email) {
      try {
        const emailText = `Great news! Your help with "${(fulfillment.needs as any)?.title}" has been confirmed as completed. Thank you for making a difference in your community!${feedback ? `\n\nFeedback from requester: ${feedback}` : ''}`;
        
        await sendEmail({
          to: helper.user.email,
          subject: `Your help with "${(fulfillment.needs as any)?.title}" is complete!`,
          text: emailText,
        });
        logger.debug("Completion notification sent to", helper.user.email);
      } catch (emailErr) {
        logger.error("Email send failed:", emailErr);
        // Non-fatal error - don't fail the API call
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    logger.error("Error in /api/offers/complete:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Validation rules for completing offers
const validationRules = [
  { field: 'fulfillmentId', required: true, type: 'string' as const },
  { field: 'feedback', required: false, type: 'string' as const, maxLength: 500 },
  { field: 'rating', required: false, type: 'number' as const }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 10 }), // 10 completions per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleCompleteOffer(req, res);
  } catch (error) {
    logger.error('Complete offer API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}