-- Storage Bucket Setup for Media Uploads
-- Run this in your Supabase SQL Editor

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-uploads',
  'media-uploads',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for media-uploads bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-uploads' AND 
    auth.role() = 'authenticated'
  );

-- Allow public read access to uploaded files
CREATE POLICY "Public read access to media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );