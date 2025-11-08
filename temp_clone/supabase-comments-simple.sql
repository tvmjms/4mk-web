-- Simple Comments Setup (Run this first)
-- Copy and paste this entire block into your Supabase SQL Editor

-- 1. Create need_comments table
CREATE TABLE IF NOT EXISTS public.need_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  need_id uuid REFERENCES public.needs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  attachment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  moderation_status text DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'pending', 'rejected', 'flagged')),
  moderation_reason text
);

-- 2. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE public.need_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for need_comments
CREATE POLICY "Anyone can read approved comments" ON public.need_comments
  FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Authenticated users can create comments" ON public.need_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create policies for user_profiles  
CREATE POLICY "Anyone can view user profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_need_comments_need_id ON public.need_comments(need_id);
CREATE INDEX IF NOT EXISTS idx_need_comments_user_id ON public.need_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_need_comments_created_at ON public.need_comments(created_at DESC);

-- 7. Function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    display_name = COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();