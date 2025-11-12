-- Create abuse_reports table for moderation and reporting system

CREATE TABLE IF NOT EXISTS public.abuse_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL,
    reported_user_id uuid,
    reported_need_id uuid,
    reported_fulfillment_id uuid,
    report_type text NOT NULL CHECK (report_type = ANY (ARRAY[
        'abuse'::text,
        'fraud'::text,
        'inappropriate'::text,
        'spam'::text,
        'other'::text
    ])),
    description text NOT NULL,
    status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY[
        'pending'::text,
        'reviewed'::text,
        'resolved'::text,
        'dismissed'::text
    ])),
    moderator_notes text,
    created_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    PRIMARY KEY (id)
);

-- Add foreign key constraints
ALTER TABLE public.abuse_reports
ADD CONSTRAINT abuse_reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.abuse_reports
ADD CONSTRAINT abuse_reports_reported_user_id_fkey 
FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.abuse_reports
ADD CONSTRAINT abuse_reports_reported_need_id_fkey 
FOREIGN KEY (reported_need_id) REFERENCES public.needs(id) ON DELETE SET NULL;

ALTER TABLE public.abuse_reports
ADD CONSTRAINT abuse_reports_reported_fulfillment_id_fkey 
FOREIGN KEY (reported_fulfillment_id) REFERENCES public.fulfillment(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_abuse_reports_reporter_id ON public.abuse_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_reported_user_id ON public.abuse_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_reported_need_id ON public.abuse_reports(reported_need_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_reported_fulfillment_id ON public.abuse_reports(reported_fulfillment_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_status ON public.abuse_reports(status);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_created_at ON public.abuse_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE public.abuse_reports IS 'Stores abuse reports and moderation flags. Used for platform safety and compliance.';




