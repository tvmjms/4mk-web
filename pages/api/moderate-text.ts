import type { NextApiRequest, NextApiResponse } from 'next';
import { contentModerator } from '@/lib/contentModerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Moderate the text
    const result = await contentModerator.moderateText(text);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Text moderation error:', error);
    return res.status(500).json({ 
      error: 'Moderation failed',
      approved: true, // Fail open for better UX
      confidence: 0,
      reasons: ['Moderation service temporarily unavailable']
    });
  }
}
