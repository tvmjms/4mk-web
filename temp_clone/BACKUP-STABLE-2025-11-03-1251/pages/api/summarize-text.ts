// pages/api/summarize-text.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, maxLength = 50 } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // If you have an OpenAI API key, uncomment and use this for even better results:
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting the core need from help requests. Your job is to identify WHAT the person actually needs, even if it's buried in a long story. Focus on:
            1. The specific item, service, or help needed
            2. Key details like time, location, urgency
            3. Keep under ${maxLength} characters
            4. Preserve essential meaning and urgency`
          },
          {
            role: 'user',
            content: `Extract the core need from this request (what they actually need help with): "${text}"`
          }
        ],
        max_tokens: 60,
        temperature: 0.1, // Lower temperature for more consistent extraction
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const summary = data.choices[0]?.message?.content?.trim() || text;
      return res.status(200).json({ summary });
    }
    */

    // Fallback to local summarization
    const summary = localSummarize(text, maxLength);
    return res.status(200).json({ summary });

  } catch (error) {
    logger.error('Summarization error:', error);
    
    // Fallback to local summarization
    const summary = localSummarize(text, maxLength);
    return res.status(200).json({ summary });
  }
}

function localSummarize(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Extract core need using the same intelligent extraction logic
  const coreNeed = extractLocalCoreNeed(text);
  
  if (coreNeed && coreNeed.length <= maxLength) {
    return coreNeed;
  }
  
  // Fallback to smart truncation
  const words = text.split(' ');
  const keywordPattern = /(need|help|urgent|food|ride|medical|emergency|childcare|housing|groceries|transportation|appointment)/i;
  
  // Prioritize sentences with keywords
  const importantWords = words.filter(word => 
    keywordPattern.test(word) || words.indexOf(word) < 3
  );
  
  let result = importantWords.join(' ');
  
  if (result.length > maxLength) {
    result = text.substring(0, maxLength - 3) + '...';
    // Try to end at a word boundary
    const lastSpace = result.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
      result = result.substring(0, lastSpace) + '...';
    }
  }
  
  return result;
}

function extractLocalCoreNeed(text: string): string | null {
  // Look for direct need statements
  const needPatterns = [
    /(?:i need|need|looking for|seeking|require)\s+([^.!?]+)/gi,
    /(?:can someone|could someone)\s+([^.!?]+)/gi,
    /(?:help (?:me )?(?:with )?)\s*([^.!?]+)/gi,
    /(?:ride to|drive to|food|groceries|childcare|medical)\s*([^.!?]*)/gi,
  ];
  
  for (const pattern of needPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      return match[0].replace(/^(i need|need|looking for|seeking|require|can someone|could someone|help me with|help with)/i, '').trim();
    }
  }
  
  return null;
}