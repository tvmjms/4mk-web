-- Add street and zip_code columns to needs table
-- Run this migration in your Supabase SQL editor

ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS zip_code text;

-- Update the schema cache
SELECT pg_notify('pgrst', 'reload schema');