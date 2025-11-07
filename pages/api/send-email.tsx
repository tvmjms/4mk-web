// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, messageHtml } = req.body;

    if (!to || !subject || !messageHtml) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    await sendEmail({ to, subject, text: messageHtml });

    res.status(200).json({ ok: true });
  } catch (error: unknown) {
    console.error('Email send failed:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
