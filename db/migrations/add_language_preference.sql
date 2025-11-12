-- Add language preference to user_profile table
-- Supports English (en) and Spanish (es) per specification

ALTER TABLE public.user_profile
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en'::text 
CHECK (preferred_language = ANY (ARRAY['en'::text, 'es'::text]));

-- Add comment
COMMENT ON COLUMN public.user_profile.preferred_language IS 'User preferred language: en (English) or es (Spanish). Defaults to English.';

-- Add index for language-based queries (if needed for analytics)
CREATE INDEX IF NOT EXISTS idx_user_profile_language ON public.user_profile(preferred_language);




