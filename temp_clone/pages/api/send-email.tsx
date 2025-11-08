// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/mailer';
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

async function handleSendEmail(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables first
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.error('Email configuration missing:', {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS
      });
      return res.status(500).json({ 
        error: 'Email service not configured. Please check environment variables.' 
      });
    }

    const { to, subject, needId, needTitle } = req.body;
    logger.debug('Email API called with:', { to, subject, needId, needTitle });

    if (!to || !subject || !needId || !needTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dashboardUrl = `https://4mk-web.vercel.app/dashboard`;
    const needUrl = `https://4mk-web.vercel.app/needs/${needId}`;

    // Get additional need details from request body
    const { street, city, state, zipCode, category, description, contactEmail, contactPhone, whatsappId } = req.body;

    // Format location similar to the modal
    const formatLocation = (street?: string, city?: string, state?: string, zipCode?: string): string | null => {
      const parts: string[] = [];
      if (street) parts.push(street);
      if (city && state) {
        parts.push(`${city}, ${state}`);
      } else if (city) {
        parts.push(city);
      } else if (state) {
        parts.push(state);
      }
      if (zipCode) parts.push(zipCode);
      return parts.length > 0 ? parts.join(' • ') : null;
    };

    const location = formatLocation(street, city, state, zipCode);
    const currentDateTime = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const messageHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>4MK Need Receipt</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 400px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #e5e7eb;">
          
          <!-- Receipt Header -->
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 16px; text-align: left;">
            <h1 style="margin: 0; font-size: 14px; font-weight: bold;">4MK COMMUNITY RECEIPT</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">#${needId.slice(-8)}</p>
          </div>
          
          <!-- Receipt Body -->
          <div style="padding: 16px;">
            
            <!-- Status -->
            <div style="text-align: center; padding: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin-bottom: 16px;">
              <p style="margin: 0; color: #15803d; font-weight: 500; font-size: 14px;">✅ POSTED SUCCESSFULLY</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${currentDateTime}</p>
            </div>
            
            <!-- Need Details -->
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 12px;">
              <h2 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${needTitle}</h2>
              <div style="font-size: 12px; color: #6b7280;">
                <div style="display: flex; margin-bottom: 4px;">
                  <span style="min-width: 64px; font-weight: 500; display: inline-block;">Category:</span>
                  <span style="text-transform: capitalize;">${category || 'Not specified'}</span>
                </div>
                ${location ? `
                <div style="display: flex; margin-bottom: 4px;">
                  <span style="min-width: 64px; font-weight: 500; display: inline-block;">Location:</span>
                  <span>${location}</span>
                </div>
                ` : ''}
                ${description ? `
                <div style="margin-top: 8px;">
                  <span style="font-weight: 500; display: block; margin-bottom: 4px;">Description:</span>
                  <div style="background-color: #f9fafb; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 11px;">
                    ${description}
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Contact Info -->
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 500; color: #1f2937;">CONTACT METHODS:</p>
              <div style="font-size: 12px; color: #374151;">
                ${contactEmail ? `<div style="margin-bottom: 2px;">📧 ${contactEmail}</div>` : ''}
                ${contactPhone ? `<div style="margin-bottom: 2px;">📱 ${contactPhone}</div>` : ''}
                ${whatsappId ? `<div style="margin-bottom: 2px;">💬 ${whatsappId}</div>` : ''}
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="margin-bottom: 16px;">
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <a href="${dashboardUrl}" style="flex: 1; background-color: #2563eb; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500; text-align: center; display: block;">Dashboard</a>
                <a href="${needUrl}/edit" style="flex: 1; background-color: #6b7280; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500; text-align: center; display: block;">Edit Need</a>
              </div>
              <a href="${needUrl}" style="width: 100%; background-color: #059669; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500; text-align: center; display: block; box-sizing: border-box;">View Full Details</a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">ForMyKin Community Platform</p>
            </div>
          </div>
        </div>
        
        <!-- Additional Message -->
        <div style="max-width: 400px; margin: 20px auto; text-align: center; color: #6b7280; font-size: 14px;">
          <p><strong>What's Next?</strong></p>
          <ul style="text-align: left; padding-left: 20px;">
            <li>Your need is now visible to the community</li>
            <li>People can contact you directly to offer help</li>
            <li>You'll receive notifications when someone responds</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 0;"><strong>4MK - ForMyKin</strong><br>Where care and connection help humanity thrive.</p>
        </div>
      </body>
      </html>
    `;

    logger.debug('Attempting to send email to:', to);
    await sendEmail({
      to,
      subject,
      html: messageHtml
    });
    logger.debug('Email sent successfully to:', to);

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Email send failed:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Validation rules for sending emails
const validationRules = [
  { field: 'to', required: true, type: 'email' as const },
  { field: 'subject', required: true, type: 'string' as const, maxLength: 200 },
  { field: 'needId', required: true, type: 'string' as const },
  { field: 'needTitle', required: true, type: 'string' as const, maxLength: 200 }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 20 }), // 20 emails per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleSendEmail(req, res);
  } catch (error) {
    logger.error('Send email API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
