// Accept offer and email requester
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/mailer";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type AcceptBody = {
  needId?: string;
};

async function handleAcceptOffer(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { needId } = (req.body || {}) as AcceptBody;
    if (!needId) return res.status(400).json({ error: "needId is required" });

    const admin = getAdminSupabaseClient();

    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: "Invalid or expired token" });

    const { data: existing } = await admin
      .from("fulfillment")
      .select("id")
      .eq("need_id", needId)
      .eq("status", "accepted")
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: "Need already accepted" });
    }

    const { data: needRow, error: needErr } = await admin
      .from("needs")
      .select("id, title, contact_email")
      .eq("id", needId)
      .maybeSingle();
    if (needErr || !needRow) return res.status(404).json({ error: "Need not found" });

    const { error: insErr } = await admin.from("fulfillment").insert({
      need_id: needId,
      helper_id: user.id,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    });

    if (insErr) {
      logger.error("Insert error:", insErr);
      return res.status(500).json({ error: "Could not create fulfillment" });
    }

    if (needRow.contact_email) {
      try {
        await sendEmail({
          to: needRow.contact_email,
          subject: `Your need "${needRow.title}" has been accepted`,
          text: `Hello, your need "${needRow.title}" was just accepted.`,
        });
        logger.debug("Email sent to", needRow.contact_email);
      } catch (emailErr) {
        logger.error("Email send failed:", emailErr);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    logger.error("Error in /api/offers/accept:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Validation rules for accepting offers
const validationRules = [
  { field: 'needId', required: true, type: 'string' as const }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 10 }), // 10 accepts per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleAcceptOffer(req, res);
  } catch (error) {
    logger.error('Accept offer API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
