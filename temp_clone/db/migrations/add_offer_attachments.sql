-- Add attachment fields to fulfillment table for offer details
-- Run this migration in your Supabase SQL editor

-- Add attachment fields to existing fulfillment table
ALTER TABLE public.fulfillment 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attachment_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_attachment_at timestamptz;

-- Create index for better performance on attachment queries
CREATE INDEX IF NOT EXISTS idx_fulfillment_attachments ON public.fulfillment USING gin(attachments);

-- Create index for attachment timestamp
CREATE INDEX IF NOT EXISTS idx_fulfillment_attachment_time ON public.fulfillment(last_attachment_at DESC);

-- Create storage bucket for offer attachments (run this in Supabase dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-attachments',
  'offer-attachments', 
  false,  -- Private bucket (authenticated access only)
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS (Row Level Security) policies for the bucket
CREATE POLICY "Users can upload their own offer attachments"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'offer-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view offer attachments for their needs/offers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'offer-attachments' AND
  (
    -- Owner of the need can see attachments
    auth.uid()::text IN (
      SELECT n.owner_id::text 
      FROM fulfillment f
      JOIN needs n ON f.need_id = n.id 
      WHERE f.id::text = (storage.foldername(name))[2]
    )
    OR
    -- Helper who uploaded can see their own attachments
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'offer-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update the schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Sample attachment structure (for reference):
-- {
--   "id": "uuid",
--   "filename": "qr-code.png", 
--   "type": "qr_code|screenshot|order_number|other",
--   "mime_type": "image/png",
--   "size": 245760,
--   "url": "storage_path",
--   "uploaded_at": "2025-11-04T10:30:00Z",
--   "description": "QR code for pickup"
-- }