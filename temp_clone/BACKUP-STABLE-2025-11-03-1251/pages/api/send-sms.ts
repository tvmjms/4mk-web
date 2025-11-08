// pages/api/send-sms.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/mailer';
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

async function handleSendSMS(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check email configuration (SMS uses email gateways)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.error('SMS requires email configuration:', {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS
      });
      return res.status(500).json({ 
        error: 'SMS service not configured. Email credentials required for carrier gateways.' 
      });
    }

    const { to, needId, needTitle } = req.body;
    logger.debug('SMS API called with:', { to, needId, needTitle });

    if (!to || !needId || !needTitle) {
      logger.error('Missing required fields:', { to, needId, needTitle });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract only digits from phone number
    const digitsOnly = to.replace(/\D/g, '');
    logger.debug('Digits extracted from phone:', digitsOnly);
    
    // Handle US phone numbers (10 or 11 digits)
    let cleanPhone = digitsOnly;
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      // Remove leading '1' for US numbers
      cleanPhone = digitsOnly.substring(1);
    } else if (digitsOnly.length === 10) {
      // Already 10 digits, use as-is
      cleanPhone = digitsOnly;
    } else {
      logger.error('Invalid phone number - not 10 or 11 digits:', { 
        original: to, 
        digitsOnly, 
        length: digitsOnly.length 
      });
      return res.status(400).json({ 
        error: `Invalid phone number format. Please enter a 10-digit US phone number. Received ${digitsOnly.length} digits: "${digitsOnly}"` 
      });
    }
    
    logger.debug('Final clean phone number:', cleanPhone);
    
    // Get carrier domains for major providers
    const carriers = [
      'txt.att.net',      // AT&T
      'tmomail.net',      // T-Mobile
      'messaging.sprintpcs.com',  // Sprint
      'vtext.com',        // Verizon
      'mymetropcs.com',   // Metro PCS
    ];

    const needUrl = `https://4mk-web.vercel.app/needs/${needId}`;
    
    // Optimize message for SMS character limits (160 chars) - Use text format for SMS gateways
    const smsMessage = `🏠 4MK Need Created!\n\n"${needTitle}"\n\nView & edit: ${needUrl}`;

    // Try sending to each carrier gateway with timeout protection
    const sendWithTimeout = async (gateway: string) => {
      return new Promise<{gateway: string, success: boolean, error?: any}>((resolve) => {
        const emailAddress = `${cleanPhone}@${gateway}`;
        
        // Set timeout for individual email sends (5 seconds max)
        const timeoutId = setTimeout(() => {
          resolve({ gateway, success: false, error: 'Timeout' });
        }, 5000);
        
        sendEmail({ 
          to: emailAddress, 
          subject: '4MK Need Created', 
          text: smsMessage 
        })
        .then(() => {
          clearTimeout(timeoutId);
          resolve({ gateway, success: true });
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          logger.debug(`Failed to send via ${gateway}:`, error);
          resolve({ gateway, success: false, error });
        });
      });
    };

    // Try carriers in sequence rather than parallel to avoid overwhelming email service
    const results = [];
    let successCount = 0;
    
    for (const gateway of carriers) {
      if (successCount >= 2) break; // Stop after 2 successful sends to avoid spam
      
      const result = await sendWithTimeout(gateway);
      results.push(result);
      
      if (result.success) {
        successCount++;
        logger.debug(`SMS sent successfully via ${gateway}`);
      }
    }

    if (successCount > 0) {
      logger.debug(`SMS sent successfully via ${successCount} gateway(s)`);
      res.status(200).json({ 
        success: true, 
        message: `SMS sent successfully via ${successCount} carrier gateway(s)` 
      });
    } else {
      logger.error('All SMS gateways failed:', results);
      res.status(500).json({ 
        error: 'SMS delivery failed. Email-to-SMS gateways may be unreliable. Consider using a dedicated SMS service for production.' 
      });
    }

  } catch (error: any) {
    logger.error('SMS send failed:', error);
    res.status(500).json({ error: error.message });
  }
}

// Validation rules for sending SMS
const validationRules = [
  { field: 'to', required: true, type: 'phone' as const },
  { field: 'needId', required: true, type: 'string' as const },
  { field: 'needTitle', required: true, type: 'string' as const, maxLength: 200 }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 10 }), // 10 SMS per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleSendSMS(req, res);
  } catch (error) {
    logger.error('Send SMS API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
