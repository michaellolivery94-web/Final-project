-- Add role support for teacher dashboard access
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));

-- Add index for efficient teacher queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update RLS policy to allow teachers to view aggregated data
CREATE POLICY "Teachers can view all learner skills" 
ON public.learner_skills 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role IN ('teacher', 'admin')
  )
  OR auth.uid() = user_id
);

CREATE POLICY "Teachers can view all activity reports" 
ON public.activity_reports 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role IN ('teacher', 'admin')
  )
  OR auth.uid() = user_id
);

-- Create a view for teacher dashboard analytics (optional optimization)
CREATE OR REPLACE VIEW public.class_proficiency_summary AS
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

-- Grant access to the view
GRANT SELECT ON public.class_proficiency_summary TO authenticated;