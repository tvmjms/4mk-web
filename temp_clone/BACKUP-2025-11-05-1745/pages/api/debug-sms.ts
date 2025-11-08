// pages/api/debug-sms.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    smtp: {},
    carriers: {}
  };

  try {
    // 1. Check environment variables
    results.environment = {
      EMAIL_USER: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
      EMAIL_PASS: process.env.EMAIL_PASS ? `✅ Set (${process.env.EMAIL_PASS.length} chars)` : '❌ Missing',
      EMAIL_FROM: process.env.EMAIL_FROM ? '✅ Set' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV
    };

    // 2. Test SMTP connection
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        console.log('Testing SMTP connection...');
        await transporter.verify();
        results.smtp.connection = '✅ SMTP connection successful';

        // 3. Test individual carrier gateways
        const carriers = [
          { name: 'AT&T', gateway: 'txt.att.net' },
          { name: 'Verizon', gateway: 'vtext.com' },
          { name: 'T-Mobile', gateway: 'tmomail.net' },
          { name: 'Sprint', gateway: 'messaging.sprintpcs.com' },
          { name: 'Metro PCS', gateway: 'mymetropcs.com' }
        ];

        const testPhone = '2489355617';
        
        for (const carrier of carriers) {
          try {
            const emailAddress = `${testPhone}@${carrier.gateway}`;
            const testMessage = `🏠 4MK SMS Test - ${carrier.name} Gateway\n\nTimestamp: ${new Date().toLocaleTimeString()}\n\nThis is a debug test message.`;
            
            console.log(`Testing ${carrier.name} (${emailAddress})...`);
            
            // Set a 10-second timeout for each carrier test
            const sendPromise = transporter.sendMail({
              from: process.env.EMAIL_FROM,
              to: emailAddress,
              subject: `4MK Test - ${carrier.name}`,
              text: testMessage
            });

            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000);
            });

            const info = await Promise.race([sendPromise, timeoutPromise]);
            
            results.carriers[carrier.name] = {
              status: '✅ Sent',
              messageId: (info as any)?.messageId || 'unknown',
              gateway: carrier.gateway,
              email: emailAddress
            };
            
          } catch (carrierError: any) {
            results.carriers[carrier.name] = {
              status: '❌ Failed',
              error: carrierError.message,
              gateway: carrier.gateway
            };
          }
        }

      } catch (smtpError: any) {
        results.smtp.connection = `❌ SMTP failed: ${smtpError.message}`;
      }
    } else {
      results.smtp.connection = '❌ Missing email credentials';
    }

    // 4. Test summary
    const carrierResults = Object.values(results.carriers);
    const successCount = carrierResults.filter((r: any) => r.status.includes('✅')).length;
    const failureCount = carrierResults.filter((r: any) => r.status.includes('❌')).length;
    
    results.summary = {
      total_carriers: carrierResults.length,
      successful: successCount,
      failed: failureCount,
      success_rate: carrierResults.length > 0 ? `${Math.round((successCount / carrierResults.length) * 100)}%` : '0%',
      overall_status: successCount > 0 ? '✅ At least one carrier working' : '❌ All carriers failed'
    };

  } catch (error: any) {
    logger.error('SMS debug error:', error);
    results.error = error.message;
  }

  return res.status(200).json(results);
}