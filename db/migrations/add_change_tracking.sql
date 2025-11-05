-- Add change tracking fields to needs table
-- Run this migration in your Supabase SQL editor

ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS edit_notes text;
ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;
ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_needs_last_edited_at ON public.needs(last_edited_at);

-- Update the schema cache
SELECT pg_notify('pgrst', 'reload schema');