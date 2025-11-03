-- Fix security issues: Remove role from profiles and create proper user_roles table

-- Drop the insecure view and policies first
DROP VIEW IF EXISTS public.class_proficiency_summary CASCADE;
DROP POLICY IF EXISTS "Teachers can view all learner skills" ON public.learner_skills;
DROP POLICY IF EXISTS "Teachers can view all activity reports" ON public.activity_reports;

-- Remove role column from profiles (security risk)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
DROP INDEX IF EXISTS idx_profiles_role;

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create secure user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Update learner_skills policies for teacher access
CREATE POLICY "Teachers can view all learner skills"
ON public.learner_skills
FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher')
  OR public.has_role(auth.uid(), 'admin')
  OR auth.uid() = user_id
);

-- Update activity_reports policies for teacher access
CREATE POLICY "Teachers can view all activity reports"
ON public.activity_reports
FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher')
  OR public.has_role(auth.uid(), 'admin')
  OR auth.uid() = user_id
);

-- Recreate view with explicit security invoker (prevents linter warning)
CREATE OR REPLACE VIEW public.class_proficiency_summary
WITH (security_invoker = true)
AS
SELECT 
  ls.skill_code,
  sa.title as skill_title,
  AVG(ls.proficiency) as avg_proficiency,
  COUNT(DISTINCT ls.user_id) as learner_count,
  MIN(ls.proficiency) as min_proficiency,
  MAX(ls.proficiency) as max_proficiency
FROM public.learner_skills ls
LEFT JOIN public.study_activities sa ON sa.skill_code = ls.skill_code
GROUP BY ls.skill_code, sa.title;

GRANT SELECT ON public.class_proficiency_summary TO authenticated;