-- Add 'Help Offered' and 'Help Accepted' status values to needs.status CHECK constraint
-- This migration updates the needs table to support the new status workflow

-- First, drop the existing constraint by recreating the column's constraint
-- We'll use a DO block to handle the constraint name dynamically
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name for needs.status
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.needs'::regclass
      AND contype = 'c'
      AND conname LIKE '%status%';
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- Add the new constraint with all status values
ALTER TABLE public.needs
ADD CONSTRAINT needs_status_check 
CHECK (status = ANY (ARRAY[
    'new'::text,
    'accepted'::text,
    'fulfilled'::text,
    'Help Offered'::text,
    'Help Accepted'::text
]));

-- Update the default if needed (keeping 'new' as default)
ALTER TABLE public.needs
ALTER COLUMN status SET DEFAULT 'new'::text;

