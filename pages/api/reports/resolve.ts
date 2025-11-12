// API to resolve abuse reports (admin only)
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type ResolveBody = {
  reportId?: string;
  status?: 'reviewed' | 'resolved' | 'dismissed';
  moderatorNotes?: string;
  action?: 'suspend_user' | 'flag_need' | 'close_thread' | 'none';
  targetId?: string;
};

async function handleResolveReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { reportId, status, moderatorNotes, action, targetId } = (req.body || {}) as ResolveBody;
    if (!reportId || !status) {
      return res.status(400).json({ error: "reportId and status are required" });
    }

    const admin = getAdminSupabaseClient();
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: "Invalid or expired token" });

    // TODO: Add admin check
    // const isAdmin = await checkAdminRole(user.id);
    // if (!isAdmin) return res.status(403).json({ error: "Admin access required" });

    // Get the report
    const { data: report, error: fetchError } = await admin
      .from("abuse_reports")
      .select("*")
      .eq("id", reportId)
      .maybeSingle();

    if (fetchError || !report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Update report status
    const updateData: any = {
      status: status,
      moderator_notes: moderatorNotes || null
    };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await admin
      .from("abuse_reports")
      .update(updateData)
      .eq("id", reportId);

    if (updateError) {
      logger.error("Report update error:", updateError);
      return res.status(500).json({ error: "Could not update report" });
    }

    // Perform action if specified
    if (action && action !== 'none') {
      if (action === 'suspend_user' && targetId) {
        // TODO: Implement user suspension
        // For now, just log it
        logger.info(`User suspension requested for: ${targetId}`);
      } else if (action === 'flag_need' && targetId) {
        await admin
          .from("needs")
          .update({ flagged: true })
          .eq("id", targetId);
      } else if (action === 'close_thread' && targetId) {
        // Close fulfillment thread by declining all active offers
        await admin
          .from("fulfillment")
          .update({ status: 'declined' })
          .eq("need_id", targetId)
          .in("status", ["proposed", "accepted"]);
      }
    }

    return res.status(200).json({ ok: true, status });
  } catch (e: any) {
    logger.error("Error in /api/reports/resolve:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Validation rules
const validationRules = [
  { field: 'reportId', required: true, type: 'string' as const },
  { field: 'status', required: true, type: 'string' as const },
  { field: 'moderatorNotes', required: false, type: 'string' as const, maxLength: 2000 },
  { field: 'action', required: false, type: 'string' as const },
  { field: 'targetId', required: false, type: 'string' as const }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 20 }),
      validateInput(validationRules)
    )(req, res);
    
    return await handleResolveReport(req, res);
  } catch (error) {
    logger.error('Resolve report API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}




