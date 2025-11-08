-- Quick Setup: Copy and paste this into your Supabase SQL Editor

-- 1. Create the storage bucket (if not done via UI)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('need-attachments', 'need-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'need-attachments' 
  AND auth.role() = 'authenticated'
);

-- 3. Allow all users to read approved attachments
CREATE POLICY "Allow public read access to approved attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'need-attachments');

-- 4. Allow users to update their own uploads
CREATE POLICY "Allow users to update their own uploads" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'need-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Allow users to delete their own uploads  
CREATE POLICY "Allow users to delete their own uploads" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'need-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);