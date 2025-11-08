import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Accept JSON with base64 images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileData, fileName, userId, contentType } = req.body;

    if (!fileData || !fileName || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    // Convert base64 to buffer
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const filePath = `${userId}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const { data, error } = await supabase.storage
      .from('need-attachments')
      .upload(filePath, buffer, {
        contentType: contentType || 'image/jpeg',
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
      path: data.path
    });

  } catch (error: any) {
    console.error('Image upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
}
