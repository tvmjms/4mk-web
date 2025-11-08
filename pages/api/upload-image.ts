import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Accept JSON with base64 images and files (not videos)
// Increased to 25MB to accommodate larger documents (20MB limit + base64 overhead)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileData, fileName, userId, contentType, fileType } = req.body;

    if (!fileData || !fileName || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate file type - allow images and documents, but NOT videos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    
    // Common document MIME types
    const allowedDocTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain', // .txt
      'text/csv', // .csv
      'application/rtf', // .rtf
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation', // .odp
    ];
    
    const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    
    // Block videos explicitly
    const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
    const detectedType = contentType || fileType || 'application/octet-stream';
    
    if (videoTypes.some(vt => detectedType.includes(vt))) {
      return res.status(400).json({ 
        error: 'Videos are not allowed. Please upload images or documents only.' 
      });
    }

    // Check if file extension matches allowed types (fallback for MIME type detection issues)
    const fileNameLower = (fileName || '').toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf', '.odt', '.ods', '.odp'];
    const hasAllowedExtension = allowedExtensions.some(ext => fileNameLower.endsWith(ext));
    const isImageType = detectedType.startsWith('image/') || allowedImageTypes.includes(detectedType);
    const isDocumentType = allowedDocTypes.includes(detectedType) || hasAllowedExtension;

    if (!isImageType && !isDocumentType && !detectedType.startsWith('image/')) {
      return res.status(400).json({ 
        error: 'File type not supported. Please upload images or standard document formats (PDF, Word, Excel, PowerPoint, Text, CSV, RTF, OpenDocument).' 
      });
    }

    // Create admin Supabase client (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Convert base64 to buffer (handle both data URLs and raw base64)
    let base64Data: string;
    if (fileData.includes(',')) {
      // Data URL format: data:image/jpeg;base64,...
      base64Data = fileData.split(',')[1];
    } else {
      // Raw base64
      base64Data = fileData;
    }
    
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size - larger limit for documents (20MB), smaller for images (10MB)
    const isImage = detectedType.startsWith('image/') || allowedImageTypes.includes(detectedType);
    const maxSize = isImage ? 10 * 1024 * 1024 : 20 * 1024 * 1024; // 10MB for images, 20MB for documents
    const maxSizeMB = isImage ? 10 : 20;
    
    if (buffer.length > maxSize) {
      return res.status(400).json({ 
        error: `File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB` 
      });
    }

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-');
    const filePath = `${userId}/${Date.now()}-${sanitizedFileName}`;
    const { data, error } = await supabase.storage
      .from('need-attachments')
      .upload(filePath, buffer, {
        contentType: detectedType || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('need-attachments')
      .getPublicUrl(data.path);

    return res.status(200).json({ 
      success: true, 
      url: publicUrl,
      path: data.path,
      fileType: detectedType
    });

  } catch (error: any) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
}
