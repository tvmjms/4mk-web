-- Storage Bucket Setup (Run this if you haven't created the bucket yet)
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('need-attachments', 'need-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'need-attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'need-attachments');

CREATE POLICY "Users can update their own files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'need-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'need-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);