-- Update existing needs to sync their status with fulfillment records
-- Run this AFTER applying add_need_status_values.sql

-- Update needs that have accepted offers but still show 'new'
UPDATE public.needs n
SET status = 'Help Accepted'
WHERE n.status = 'new'
  AND EXISTS (
    SELECT 1 FROM public.fulfillment f
    WHERE f.need_id = n.id
      AND f.status = 'accepted'
  );

-- Update needs that have proposed offers but still show 'new'
-- (but only if they don't have any accepted offers)
UPDATE public.needs n
SET status = 'Help Offered'
WHERE n.status = 'new'
  AND EXISTS (
    SELECT 1 FROM public.fulfillment f
    WHERE f.need_id = n.id
      AND f.status = 'proposed'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.fulfillment f
    WHERE f.need_id = n.id
      AND f.status = 'accepted'
  );

