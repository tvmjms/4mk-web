-- Add offer system fields to existing fulfillment table
-- Phase 1: Manual offer system with minimal database changes

ALTER TABLE public.fulfillment 
ADD COLUMN IF NOT EXISTS offer_type text DEFAULT 'general'::text 
  CHECK (offer_type = ANY (ARRAY[
    'general'::text,           -- Basic help offer (existing behavior)
    'digital_service'::text,   -- Online service transfer (manual codes)
    'store_pickup'::text,      -- Store-based pickup (manual coordination)
    'service_booking'::text    -- Appointment/service booking (manual)
  ])),
ADD COLUMN IF NOT EXISTS offer_description text,
ADD COLUMN IF NOT EXISTS contact_method text DEFAULT 'email'::text 
  CHECK (contact_method = ANY (ARRAY[
    'email'::text,             -- Use existing email system
    'platform_message'::text   -- Future: in-platform messaging
  ]));

-- Add completion tracking
ALTER TABLE public.fulfillment 
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_fulfillment_offer_type ON public.fulfillment(offer_type);
