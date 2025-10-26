// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMail } from '@/lib/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, messageHtml } = req.body;

    if (!to || !subject || !messageHtml) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    await sendMail(to, subject, messageHtml);

    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Email send failed:', error);
    res.status(500).json({ error: error.message });
  }
}
