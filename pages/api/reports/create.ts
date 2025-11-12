// API to create abuse reports
import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from '@/lib/logger';
import { getAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/mailer";
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

type ReportBody = {
  reportedUserId?: string;
  reportedNeedId?: string;
  reportedFulfillmentId?: string;
  reportType?: 'abuse' | 'fraud' | 'inappropriate' | 'spam' | 'other';
  description?: string;
};

async function handleCreateReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { reportedUserId, reportedNeedId, reportedFulfillmentId, reportType, description } = (req.body || {}) as ReportBody;
    
    if (!reportType || !description) {
      return res.status(400).json({ error: "reportType and description are required" });
    }

    if (!reportedUserId && !reportedNeedId && !reportedFulfillmentId) {
      return res.status(400).json({ error: "At least one of reportedUserId, reportedNeedId, or reportedFulfillmentId must be provided" });
    }

    const admin = getAdminSupabaseClient();
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: "Invalid or expired token" });

    // Create the report
    const { data: report, error: insertError } = await admin
      .from("abuse_reports")
      .insert([
        {
          reporter_id: user.id,
          reported_user_id: reportedUserId || null,
          reported_need_id: reportedNeedId || null,
          reported_fulfillment_id: reportedFulfillmentId || null,
          report_type: reportType,
          description: description,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (insertError) {
      logger.error("Report insert error:", insertError);
      return res.status(500).json({ error: "Could not create report" });
    }

    // Send immediate alert to 4MK platform (using admin email or notification system)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
    if (adminEmail) {
      try {
        const reportDetails = [
          `Report Type: ${reportType}`,
          `Reporter: ${user.email || user.id}`,
          reportedUserId ? `Reported User: ${reportedUserId}` : '',
          reportedNeedId ? `Reported Need: ${reportedNeedId}` : '',
          reportedFulfillmentId ? `Reported Fulfillment: ${reportedFulfillmentId}` : '',
          `Description: ${description}`
        ].filter(Boolean).join('\n');

        await sendEmail({
          to: adminEmail,
          subject: `🚨 4MK Abuse Report: ${reportType}`,
          text: `A new abuse report has been submitted on 4MK:\n\n${reportDetails}\n\nReport ID: ${report.id}\n\nPlease review and take appropriate action.`,
        });
        
        logger.debug("Abuse report alert sent to admin:", adminEmail);
      } catch (emailErr) {
        logger.error("Admin alert email failed:", emailErr);
        // Non-fatal - report is still created
      }
    }

    // Auto-flag content if report type suggests immediate action
    if (reportType === 'fraud' || reportType === 'abuse') {
      if (reportedNeedId) {
        await admin
          .from("needs")
          .update({ flagged: true })
          .eq("id", reportedNeedId);
      }
    }

    return res.status(201).json({ ok: true, reportId: report.id });
  } catch (e: any) {
    logger.error("Error in /api/reports/create:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

// Validation rules
const validationRules = [
  { field: 'reportType', required: true, type: 'string' as const },
  { field: 'description', required: true, type: 'string' as const, maxLength: 2000 },
  { field: 'reportedUserId', required: false, type: 'string' as const },
  { field: 'reportedNeedId', required: false, type: 'string' as const },
  { field: 'reportedFulfillmentId', required: false, type: 'string' as const }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 10 }), // 10 reports per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleCreateReport(req, res);
  } catch (error) {
    logger.error('Create report API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}




