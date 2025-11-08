-- Link comments to fulfillments to create connection-based chat history
-- This allows comments to be tied to specific requester-helper connections

-- Add fulfillment_id to need_comments table (nullable for backward compatibility)
ALTER TABLE public.need_comments 
ADD COLUMN IF NOT EXISTS fulfillment_id uuid;

-- Add foreign key constraint
ALTER TABLE public.need_comments
ADD CONSTRAINT need_comments_fulfillment_id_fkey 
FOREIGN KEY (fulfillment_id) 
REFERENCES public.fulfillment(id) 
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_need_comments_fulfillment_id ON public.need_comments(fulfillment_id);

-- Add comment to explain the column
COMMENT ON COLUMN public.need_comments.fulfillment_id IS 'Links comment to a specific fulfillment/offer, creating a connection-based chat history between requester and helper';

