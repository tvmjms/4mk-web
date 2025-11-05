-- Supabase Storage Setup for 4MK Web Application
-- Run this in your Supabase SQL Editor to set up storage buckets and policies

-- Create storage bucket for need attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('need-attachments', 'need-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies for the bucket

-- Enable RLS on storage.objects if not already enabled
-- (This is usually enabled by default in Supabase)

-- Policy: Allow all users to read approved attachments
CREATE POLICY "Allow public read access to approved attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'need-attachments');

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'need-attachments' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own uploads
CREATE POLICY "Allow users to update their own uploads" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'need-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Allow users to delete their own uploads" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'need-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a function to generate secure download URLs
CREATE OR REPLACE FUNCTION get_secure_attachment_url(file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url text;
BEGIN
  -- Generate a signed URL that expires in 1 hour
  SELECT storage.presigned_url('need-attachments', file_path, 3600)
  INTO signed_url;
  
  RETURN signed_url;
END;
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION get_secure_attachment_url(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_secure_attachment_url(text) TO anon;