-- Fix Database Issues Migration
-- This migration fixes the missing columns and tables causing 404 errors

-- 1. Add missing order_index column to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Update existing questions to have order_index based on sequence_order
UPDATE public.questions 
SET order_index = sequence_order 
WHERE order_index IS NULL;

-- Make order_index NOT NULL with default
ALTER TABLE public.questions 
ALTER COLUMN order_index SET NOT NULL,
ALTER COLUMN order_index SET DEFAULT 0;

-- 2. Create assessment_sessions table (alternative name for quiz_sessions that code expects)
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_tests INTEGER DEFAULT 1,
  current_test_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress',
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assessment_sessions
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessment_sessions
CREATE POLICY "Users can view their own assessment sessions"
  ON public.assessment_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessment sessions"
  ON public.assessment_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessment sessions"
  ON public.assessment_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessment sessions"
  ON public.assessment_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create user_profiles table (view or table that code expects)
-- This will be a view that combines profiles and user_roles for easier access
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  COALESCE(ur.role, 'user'::app_role) as role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id;

-- Grant permissions on the view
GRANT SELECT ON public.user_profiles TO authenticated;

-- 4. Add RLS policies for the user_profiles view
-- Note: RLS on views works through the underlying tables

-- 5. Create a function to help with user profile access
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar_url TEXT,
  role app_role,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    COALESCE(ur.role, 'user'::app_role) as role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.id = user_uuid
    AND (p.id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
$$;

-- 6. Update questions table to ensure proper question_text column
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS question_text TEXT;

-- Copy title to question_text if question_text is empty
UPDATE public.questions 
SET question_text = title 
WHERE question_text IS NULL OR question_text = '';

-- Make question_text NOT NULL
ALTER TABLE public.questions 
ALTER COLUMN question_text SET NOT NULL;

-- 7. Add category column to questions (for easier access)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update category from category table
UPDATE public.questions q
SET category = qc.name
FROM public.question_categories qc
WHERE q.category_id = qc.id AND (q.category IS NULL OR q.category = '');

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON public.questions(order_index);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON public.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_id ON public.assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON public.assessment_sessions(status);

-- 9. Create updated_at trigger for assessment_sessions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assessment_sessions_updated_at ON public.assessment_sessions;
CREATE TRIGGER update_assessment_sessions_updated_at
    BEFORE UPDATE ON public.assessment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
