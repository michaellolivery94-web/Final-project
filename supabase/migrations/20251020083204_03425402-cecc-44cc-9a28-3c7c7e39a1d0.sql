-- Study Buddy Tables for Personalized Learning

-- Learner skills and proficiency tracking
CREATE TABLE public.learner_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_code TEXT NOT NULL, -- e.g., 'CBC-MATH-4.3', 'CBC-ENG-5.2'
  proficiency DECIMAL(3,2) DEFAULT 0.50 CHECK (proficiency >= 0 AND proficiency <= 1),
  last_practiced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_code)
);

-- Activity catalog with Kenyan context
CREATE TABLE public.study_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL, -- 'quiz', 'practice', 'review', 'video'
  skill_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_time_sec INTEGER DEFAULT 60,
  difficulty DECIMAL(3,2) DEFAULT 0.50 CHECK (difficulty >= 0 AND difficulty <= 1),
  content JSONB NOT NULL, -- Stores question/answer pairs, video links, etc.
  locale TEXT DEFAULT 'ke', -- Kenyan context
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity completions and performance
CREATE TABLE public.activity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.study_activities(id) ON DELETE CASCADE,
  score DECIMAL(3,2) CHECK (score >= 0 AND score <= 1),
  time_spent_sec INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Hydration cache for instant loads
CREATE TABLE public.hydration_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  starter_activity_id UUID REFERENCES public.study_activities(id),
  reason TEXT,
  cached_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_learner_skills_user_id ON public.learner_skills(user_id);
CREATE INDEX idx_learner_skills_skill_code ON public.learner_skills(skill_code);
CREATE INDEX idx_study_activities_skill_code ON public.study_activities(skill_code);
CREATE INDEX idx_study_activities_locale ON public.study_activities(locale);
CREATE INDEX idx_activity_reports_user_id ON public.activity_reports(user_id);
CREATE INDEX idx_activity_reports_completed_at ON public.activity_reports(completed_at DESC);

-- RLS Policies
ALTER TABLE public.learner_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_cache ENABLE ROW LEVEL SECURITY;

-- Learner skills: users can only see/modify their own
CREATE POLICY "Users can view their own skills"
  ON public.learner_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
  ON public.learner_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON public.learner_skills FOR UPDATE
  USING (auth.uid() = user_id);

-- Study activities: public read access
CREATE POLICY "Activities are viewable by everyone"
  ON public.study_activities FOR SELECT
  USING (true);

-- Activity reports: users can only see/create their own
CREATE POLICY "Users can view their own reports"
  ON public.activity_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON public.activity_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Hydration cache: users can only see their own
CREATE POLICY "Users can view their own cache"
  ON public.hydration_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage cache"
  ON public.hydration_cache FOR ALL
  USING (true);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_learner_skills_updated_at
  BEFORE UPDATE ON public.learner_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Kenyan-context starter activities
INSERT INTO public.study_activities (activity_type, skill_code, title, description, estimated_time_sec, difficulty, content, locale) VALUES
  ('quiz', 'CBC-MATH-4.3', 'Fractions at Mama Njeri''s Shop', 'Help Mama Njeri divide her samosas fairly', 45, 0.40, 
   '{"question": "Mama Njeri has 12 samosas. She sells 1/4 of them. How many samosas does she sell?", "options": ["2", "3", "4", "6"], "correct": 1, "explanation": "1/4 of 12 = 12 ÷ 4 = 3 samosas"}'::jsonb, 'ke'),
  
  ('practice', 'CBC-ENG-5.1', 'Write About Your Favorite Matatu', 'Describe a matatu you''ve seen in Nairobi', 60, 0.50,
   '{"prompt": "Describe a matatu you remember. What colors was it? What music was playing? Use at least 3 adjectives.", "word_count": 50}'::jsonb, 'ke'),
  
  ('quiz', 'CBC-MATH-3.2', 'Counting Shillings', 'Practice with Kenyan currency', 30, 0.30,
   '{"question": "You have three 50 KES coins and two 20 KES coins. How much money do you have?", "options": ["100 KES", "150 KES", "190 KES", "200 KES"], "correct": 2, "explanation": "(3 × 50) + (2 × 20) = 150 + 40 = 190 KES"}'::jsonb, 'ke'),
  
  ('review', 'CBC-SCI-4.1', 'Plants in Kenya', 'Learn about crops grown in Kenya', 90, 0.45,
   '{"content": "Kenya grows many crops including tea, coffee, maize, and sugarcane. Tea is grown in the highlands where it is cool and wet.", "quiz": [{"q": "Which crop grows best in cool, wet highlands?", "options": ["Maize", "Tea", "Sugarcane"], "correct": 1}]}'::jsonb, 'ke'),
  
  ('quiz', 'CBC-MATH-5.4', 'Nairobi to Mombasa Distance', 'Calculate travel times', 45, 0.55,
   '{"question": "A bus travels from Nairobi to Mombasa (480 km) at 80 km/h. How many hours does the journey take?", "options": ["4 hours", "5 hours", "6 hours", "7 hours"], "correct": 2, "explanation": "Time = Distance ÷ Speed = 480 ÷ 80 = 6 hours"}'::jsonb, 'ke');