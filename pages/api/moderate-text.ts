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
    console.error('Text moderation API error:', error);
    // The moderateText function already has fallback logic, but if it throws,
    // we should block for safety (fail-closed for security)
    return res.status(500).json({ 
      error: 'Moderation service error',
      approved: false, // Fail closed for safety - block content if we can't verify it
      confidence: 0,
      reasons: ['Moderation service error - content blocked for safety. Please try again or contact support.'],
      category: 'safe',
      suggestedAction: 'review'
    });
  }
}
