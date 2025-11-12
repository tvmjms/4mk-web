-- Add new fulfillment statuses: withdrawn, clarifying, return_initiated, returned, non_reversible
-- This migration updates the CHECK constraint on fulfillment.status

-- First, drop the existing constraint
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.fulfillment'::regclass 
      AND contype = 'c' 
      AND conname LIKE '%status%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.fulfillment DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- Add the new constraint with all statuses
ALTER TABLE public.fulfillment
ADD CONSTRAINT fulfillment_status_check 
CHECK (status = ANY (ARRAY[
    'proposed'::text,
    'accepted'::text,
    'declined'::text,
    'fulfilled'::text,
    'withdrawn'::text,
    'clarifying'::text,
    'return_initiated'::text,
    'returned'::text,
    'non_reversible'::text
]));

-- Add comment to explain the statuses
COMMENT ON COLUMN public.fulfillment.status IS 'Fulfillment status: proposed (initial offer), accepted (requester accepted), declined (requester declined), fulfilled (completed), withdrawn (helper withdrew), clarifying (questions being discussed), return_initiated (return requested), returned (return completed), non_reversible (cannot be returned)';



