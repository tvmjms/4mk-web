-- Add return/correction fields to fulfillment table

ALTER TABLE public.fulfillment
ADD COLUMN IF NOT EXISTS return_reason text,
ADD COLUMN IF NOT EXISTS return_initiated_at timestamptz,
ADD COLUMN IF NOT EXISTS returned_at timestamptz,
ADD COLUMN IF NOT EXISTS is_non_reversible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

-- Add comments
COMMENT ON COLUMN public.fulfillment.return_reason IS 'Reason provided for initiating a return';
COMMENT ON COLUMN public.fulfillment.return_initiated_at IS 'Timestamp when return was initiated by requester';
COMMENT ON COLUMN public.fulfillment.returned_at IS 'Timestamp when return was completed';
COMMENT ON COLUMN public.fulfillment.is_non_reversible IS 'Indicates if this fulfillment cannot be returned (e.g., utility payments, shelter aid)';
COMMENT ON COLUMN public.fulfillment.withdrawn_at IS 'Timestamp when helper withdrew the offer';




