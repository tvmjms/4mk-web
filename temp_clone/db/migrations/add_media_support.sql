-- Database schema update for media support
-- Add media attachment fields to needs table and create storage policies

-- Add attachment fields to needs table
ALTER TABLE public.needs 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attachment_count integer DEFAULT 0;

-- Create comments table for need responses with media support
CREATE TABLE IF NOT EXISTS public.need_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    need_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text,
    attachments jsonb DEFAULT NULL,
    attachment_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    moderation_status text DEFAULT 'approved'::text CHECK (moderation_status = ANY (ARRAY['approved'::text, 'pending'::text, 'rejected'::text, 'flagged'::text])),
    moderation_reason text,
    PRIMARY KEY (id),
    FOREIGN KEY (need_id) REFERENCES public.needs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on comments
ALTER TABLE public.need_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for need_comments
CREATE POLICY "Users can view all comments" ON public.need_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.need_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.need_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.need_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_need_comments_need_id ON public.need_comments(need_id);
CREATE INDEX IF NOT EXISTS idx_need_comments_user_id ON public.need_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_need_comments_created_at ON public.need_comments(created_at);

-- Add updated_at trigger for comments
CREATE OR REPLACE FUNCTION public.update_need_comments_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_need_comments_updated_at ON public.need_comments;
CREATE TRIGGER update_need_comments_updated_at
    BEFORE UPDATE ON public.need_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_need_comments_updated_at();

-- Storage bucket policies for need attachments (if bucket exists)
-- Note: These would need to be run in Supabase dashboard or via SQL editor

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('need-attachments', 'need-attachments', false)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "Users can upload their own need attachments" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'need-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view need attachments" ON storage.objects
--     FOR SELECT USING (bucket_id = 'need-attachments');

-- CREATE POLICY "Users can delete their own need attachments" ON storage.objects
--     FOR DELETE USING (bucket_id = 'need-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add moderation fields to existing tables
ALTER TABLE public.fulfillment 
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved'::text CHECK (moderation_status = ANY (ARRAY['approved'::text, 'pending'::text, 'rejected'::text, 'flagged'::text])),
ADD COLUMN IF NOT EXISTS moderation_reason text;

-- Update needs table to include moderation
ALTER TABLE public.needs
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved'::text CHECK (moderation_status = ANY (ARRAY['approved'::text, 'pending'::text, 'rejected'::text, 'flagged'::text])),
ADD COLUMN IF NOT EXISTS moderation_reason text;

COMMENT ON COLUMN public.needs.attachments IS 'JSON array of media attachments with moderation status';
COMMENT ON COLUMN public.needs.attachment_count IS 'Number of approved attachments for quick filtering';
COMMENT ON COLUMN public.need_comments.attachments IS 'JSON array of comment media attachments';
COMMENT ON COLUMN public.need_comments.moderation_status IS 'AI moderation status for content safety';