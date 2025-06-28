
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create question categories table
CREATE TABLE public.question_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.question_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  options JSONB NOT NULL,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz sessions table
CREATE TABLE public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_question INTEGER DEFAULT 1,
  total_questions INTEGER DEFAULT 10,
  answers JSONB DEFAULT '[]'::jsonb,
  result JSONB,
  score INTEGER DEFAULT 0
);

-- Create quiz results table for leaderboard
CREATE TABLE public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  personality_type TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for question_categories
CREATE POLICY "Anyone can view categories"
  ON public.question_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.question_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for questions
CREATE POLICY "Anyone can view active questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.quiz_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.quiz_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.quiz_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for quiz_results
CREATE POLICY "Anyone can view quiz results for leaderboard"
  ON public.quiz_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own results"
  ON public.quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating profiles when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data ->> 'username');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert default question categories
INSERT INTO public.question_categories (name, description, color) VALUES
('Leadership Style', 'Questions about leadership approach and philosophy', '#8b5cf6'),
('Problem Solving', 'Questions about analytical and logical thinking', '#3b82f6'),
('Communication', 'Questions about interpersonal skills and expression', '#10b981'),
('Decision Making', 'Questions about choice processes and judgment', '#f59e0b'),
('Team Dynamics', 'Questions about collaboration and social interaction', '#ef4444');

-- Insert sample questions
INSERT INTO public.questions (category_id, title, subtitle, options, sequence_order) VALUES
(
  (SELECT id FROM public.question_categories WHERE name = 'Problem Solving'),
  'When facing a complex problem, you prefer to:',
  'Logical-Mathematical',
  '["Break it down into smaller, manageable parts", "Look for patterns and connections", "Trust your intuition and gut feeling", "Seek advice from others first"]'::jsonb,
  1
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Team Dynamics'),
  'Your ideal work environment is:',
  'Spatial Intelligence',
  '["A quiet, organized space with minimal distractions", "A collaborative area with lots of interaction", "A dynamic space that changes frequently", "A comfortable, personalized environment"]'::jsonb,
  2
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Leadership Style'),
  'When learning something new, you:',
  'Learning Style',
  '["Read extensively and take detailed notes", "Dive in and learn by doing", "Discuss it with others to understand", "Visualize concepts and create mental maps"]'::jsonb,
  3
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Leadership Style'),
  'Your approach to leadership is:',
  'Leadership Philosophy',
  '["Lead by example and set clear standards", "Inspire and motivate through vision", "Collaborate and build consensus", "Adapt your style to each situation"]'::jsonb,
  4
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Decision Making'),
  'When making important decisions, you:',
  'Decision Making',
  '["Analyze all available data thoroughly", "Consider the impact on all stakeholders", "Trust your experience and instincts", "Seek multiple perspectives before deciding"]'::jsonb,
  5
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Team Dynamics'),
  'Your greatest strength in teams is:',
  'Team Dynamics',
  '["Bringing structure and organization", "Generating creative ideas and solutions", "Facilitating communication and harmony", "Driving results and maintaining focus"]'::jsonb,
  6
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Problem Solving'),
  'When facing setbacks, you typically:',
  'Resilience',
  '["Analyze what went wrong and adjust", "Stay optimistic and keep pushing forward", "Seek support from your network", "Take time to reflect and recharge"]'::jsonb,
  7
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Communication'),
  'Your communication style is best described as:',
  'Communication',
  '["Direct and to-the-point", "Enthusiastic and inspiring", "Thoughtful and considerate", "Adaptable to the audience"]'::jsonb,
  8
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Leadership Style'),
  'You are most energized by:',
  'Energy Source',
  '["Solving complex challenges", "Creating something new", "Helping others succeed", "Achieving ambitious goals"]'::jsonb,
  9
),
(
  (SELECT id FROM public.question_categories WHERE name = 'Decision Making'),
  'Your vision of success includes:',
  'Success Definition',
  '["Mastering your craft and expertise", "Making a meaningful impact", "Building strong relationships", "Achieving recognition and influence"]'::jsonb,
  10
);
