-- Add offer detail fields per specification
-- These fields capture helper information and requester preferences

ALTER TABLE public.fulfillment
ADD COLUMN IF NOT EXISTS max_cashless_amount numeric(10,2) CHECK (max_cashless_amount IS NULL OR max_cashless_amount <= 100),
ADD COLUMN IF NOT EXISTS order_id text,
ADD COLUMN IF NOT EXISTS proof_url text,
ADD COLUMN IF NOT EXISTS delivery_preferences text,
ADD COLUMN IF NOT EXISTS brand_preference text,
ADD COLUMN IF NOT EXISTS case_manager_info text;

-- Add comments
COMMENT ON COLUMN public.fulfillment.max_cashless_amount IS 'Maximum cashless transaction amount (capped at $100 per spec)';
COMMENT ON COLUMN public.fulfillment.order_id IS 'Order ID or transaction reference provided by helper';
COMMENT ON COLUMN public.fulfillment.proof_url IS 'URL to proof document/image uploaded by helper';
COMMENT ON COLUMN public.fulfillment.delivery_preferences IS 'Requester delivery preferences (optional)';
COMMENT ON COLUMN public.fulfillment.brand_preference IS 'Requester brand preference (optional)';
COMMENT ON COLUMN public.fulfillment.case_manager_info IS 'Case manager information for shelter aid (optional)';

-- Add index for order_id lookups
CREATE INDEX IF NOT EXISTS idx_fulfillment_order_id ON public.fulfillment(order_id) WHERE order_id IS NOT NULL;




