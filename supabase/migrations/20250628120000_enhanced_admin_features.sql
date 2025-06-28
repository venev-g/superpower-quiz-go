-- Enhanced Admin Features Migration
-- Run this migration to add all the required features for admin panel and dashboard

-- Create admin user role and set up admin credentials
-- First, let's add a default admin user (you can change this later)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@quiz.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"username": "Admin User"}',
  '{}'
) ON CONFLICT (email) DO NOTHING;

-- Add admin role to the admin user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'admin@quiz.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create question types enum for different question formats
CREATE TYPE IF NOT EXISTS public.question_type AS ENUM ('multiple_choice', 'single_choice', 'rating_scale', 'multiselect');

-- Add question_type column to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS question_type public.question_type DEFAULT 'single_choice';

-- Add rating scale options
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS rating_min INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS rating_max INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS rating_labels JSONB DEFAULT '[]'::jsonb;

-- Create analytics table for tracking quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  average_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on analytics
ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.quiz_analytics;
CREATE POLICY "Users can view their own analytics"
  ON public.quiz_analytics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own analytics" ON public.quiz_analytics;
CREATE POLICY "Users can update their own analytics"
  ON public.quiz_analytics FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.quiz_analytics;
CREATE POLICY "Users can insert their own analytics"
  ON public.quiz_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.quiz_analytics;
CREATE POLICY "Admins can view all analytics"
  ON public.quiz_analytics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update analytics when quiz is completed
CREATE OR REPLACE FUNCTION public.update_quiz_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or insert analytics record
  INSERT INTO public.quiz_analytics (user_id, total_attempts, last_attempt_at, average_score)
  VALUES (
    NEW.user_id,
    1,
    NEW.created_at,
    NEW.score
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_attempts = quiz_analytics.total_attempts + 1,
    last_attempt_at = NEW.created_at,
    average_score = (
      SELECT AVG(score)::DECIMAL(5,2)
      FROM public.quiz_results
      WHERE user_id = NEW.user_id
    ),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger to update analytics when quiz result is inserted
DROP TRIGGER IF EXISTS on_quiz_result_created ON public.quiz_results;
CREATE TRIGGER on_quiz_result_created
  AFTER INSERT ON public.quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quiz_analytics();

-- Update existing questions to have proper question types
UPDATE public.questions SET question_type = 'single_choice' WHERE question_type IS NULL;

-- Add better RLS policies for admin access to all user results
DROP POLICY IF EXISTS "Admins can view all quiz results" ON public.quiz_results;
CREATE POLICY "Admins can view all quiz results"
  ON public.quiz_results FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure profiles are accessible for admin analytics
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
