import type { NextApiRequest, NextApiResponse } from 'next';
import { contentModerator } from '@/lib/contentModerator';

/**
 * API endpoint for moderating images and files using OpenAI's free Moderation API
 * This is completely FREE - perfect for charity use cases
 * STRICT MODE: Blocks inappropriate content (fail-closed for safety)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, fileName, fileType } = req.body;

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ 
        flagged: true,
        approved: false,
        error: 'Image/file data is required',
        message: 'Image/file data is required'
      });
    }

    // Extract base64 data (remove data URL prefix if present)
    const base64Match = imageData.match(/^data:([^;]+);base64,(.+)$/);
    const base64Data = base64Match ? base64Match[2] : imageData;
    const mimeType = base64Match ? base64Match[1] : (fileType || 'image/jpeg');

    // Check base64 data size (rough estimate: base64 is ~33% larger than binary)
    const estimatedSizeMB = (base64Data.length * 3) / 4 / 1024 / 1024;
    if (estimatedSizeMB > 10) {
      return res.status(400).json({
        flagged: true,
        approved: false,
        error: 'File too large',
        message: `File size (${estimatedSizeMB.toFixed(2)}MB) exceeds maximum allowed size of 10MB`
      });
    }

    // Convert base64 to buffer for moderation
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch (bufferError: any) {
      console.error('Error converting base64 to buffer:', bufferError);
      return res.status(400).json({
        flagged: true,
        approved: false,
        error: 'Invalid image data',
        message: 'Unable to process image data. Please ensure the file is a valid image or document.'
      });
    }

    // Determine file name with proper extension for PDF detection
    let detectedFileName = fileName || 'uploaded-file';
    if (!detectedFileName.includes('.') && mimeType) {
      // Add extension based on mime type
      if (mimeType === 'application/pdf') {
        detectedFileName += '.pdf';
      } else if (mimeType.startsWith('image/')) {
        const ext = mimeType.split('/')[1];
        detectedFileName += `.${ext === 'jpeg' ? 'jpg' : ext}`;
    }
    }

    // Use contentModerator for proper moderation
    let moderationResult;
    try {
      moderationResult = await Promise.race([
        contentModerator.moderateImage(
          buffer,
          detectedFileName,
          {
            checkNudity: true,
            checkViolence: true,
            checkIllegalItems: true,
            checkSpam: true,
            maxFileSizeMB: 10 // 10MB max for images/files
          }
        ),
        // Timeout after 30 seconds
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Moderation timeout')), 30000)
        )
      ]) as any;
    } catch (modError: any) {
      console.error('Error during moderation:', modError);
      // Fail-closed: Block on error for safety
      return res.status(500).json({
        flagged: true,
        approved: false,
        error: 'Moderation service error',
        message: modError.message?.includes('timeout') 
          ? 'Moderation service timed out. Please try with a smaller file or try again later.'
          : 'Moderation service error - content blocked for safety. Please try again or contact support.'
      });
    }

    // Return result in format expected by frontend
    if (!moderationResult.approved) {
      return res.status(200).json({
        flagged: true,
        approved: false,
        categories: {},
        flaggedCategories: moderationResult.reasons,
        message: `Content contains inappropriate material: ${moderationResult.reasons.join(', ')}`
      });
    }

    return res.status(200).json({
      flagged: false,
      approved: true,
      categories: {},
      message: 'Content is safe'
    });

  } catch (error: any) {
    console.error('Error moderating image/file:', error);
    
    // Fail-closed: Block on error for safety
    return res.status(500).json({ 
      flagged: true,
      approved: false,
      error: 'Moderation service error',
      categories: {},
      message: 'Moderation service error - content blocked for safety. Please try again or contact support.'
    });
  }
}
