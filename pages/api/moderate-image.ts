import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint for moderating images using OpenAI's free Moderation API
 * This is completely FREE - perfect for charity use cases
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData } = req.body;

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('⚠️ OPENAI_API_KEY not configured - allowing image upload (fail-open)');
      return res.status(200).json({ 
        flagged: false, 
        categories: {},
        message: 'Moderation unavailable - upload allowed' 
      });
    }

    // Call OpenAI Moderation API with image
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: [
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      }),
    });

    if (!moderationResponse.ok) {
      const errorText = await moderationResponse.text();
      console.error('OpenAI moderation API error:', moderationResponse.status, errorText);
      
      // Fail-open: If moderation service is down, allow the upload
      return res.status(200).json({ 
        flagged: false, 
        categories: {},
        message: 'Moderation service unavailable - upload allowed' 
      });
    }

    const moderationData = await moderationResponse.json();
    const result = moderationData.results[0];

    if (result.flagged) {
      // Find which categories were flagged
      const flaggedCategories = Object.keys(result.categories)
        .filter(category => result.categories[category])
        .map(category => category.replace(/_/g, ' '));

      return res.status(200).json({
        flagged: true,
        categories: result.categories,
        flaggedCategories,
        message: `Image contains inappropriate content: ${flaggedCategories.join(', ')}`
      });
    }

    return res.status(200).json({
      flagged: false,
      categories: result.categories,
      message: 'Image is safe'
    });

  } catch (error) {
    console.error('Error moderating image:', error);
    
    // Fail-open: If there's an error, allow the upload
    return res.status(200).json({ 
      flagged: false, 
      categories: {},
      message: 'Moderation error - upload allowed' 
    });
  }
}
