-- Update fulfillment offer_type constraint to match form values
-- This fixes the constraint violation error when submitting offers
-- Date: 2025-11-08

-- Drop the existing constraint
ALTER TABLE public.fulfillment 
DROP CONSTRAINT IF EXISTS fulfillment_offer_type_check;

-- Add the updated constraint with all offer types used in the form
ALTER TABLE public.fulfillment 
ADD CONSTRAINT fulfillment_offer_type_check 
CHECK (offer_type = ANY (ARRAY[
  'general'::text,
  'voucher'::text,
  'delivery'::text,
  'pickup'::text,
  'transport_credit'::text,
  'shelter_credit'::text,
  'digital_service'::text,
  'store_pickup'::text,
  'service_booking'::text
]));

-- Add comment to document the offer types
COMMENT ON COLUMN public.fulfillment.offer_type IS 'Type of help offered: voucher (gift card), delivery (online), pickup (retail), transport_credit, shelter_credit, general, digital_service, store_pickup, service_booking';






