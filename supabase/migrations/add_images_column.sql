-- Add images column to needs table
-- This allows storing up to 3 image URLs per need for visual context
-- Images are stored in the 'need-attachments' Supabase Storage bucket

ALTER TABLE needs 
ADD COLUMN IF NOT EXISTS images text[];

-- Add comment for documentation
COMMENT ON COLUMN needs.images IS 'Array of Supabase Storage URLs from need-attachments bucket for uploaded images (max 3). Images are auto-compressed to 800px/500KB for sustainability.';

-- Optional: Add check constraint to limit array size
-- (Currently enforced in application layer)
