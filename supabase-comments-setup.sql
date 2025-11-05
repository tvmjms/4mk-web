-- Comments System Setup
-- Run this in your Supabase SQL Editor

-- Create need_comments table
CREATE TABLE IF NOT EXISTS need_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  need_id uuid REFERENCES needs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  attachment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  moderation_status text DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'pending', 'rejected', 'flagged')),
  moderation_reason text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_need_comments_need_id ON need_comments(need_id);
CREATE INDEX IF NOT EXISTS idx_need_comments_user_id ON need_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_need_comments_created_at ON need_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_need_comments_moderation ON need_comments(moderation_status);

-- Enable Row Level Security
ALTER TABLE need_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments
CREATE POLICY "Users can read approved comments" ON need_comments
  FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Users can create comments" ON need_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON need_comments
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    created_at > (now() - interval '1 hour')
  );

CREATE POLICY "Users can delete own comments" ON need_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Update timestamp trigger
DROP TRIGGER IF EXISTS update_need_comments_updated_at ON need_comments;
CREATE TRIGGER update_need_comments_updated_at
  BEFORE UPDATE ON need_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Anyone can view user profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- New user signup handler
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();