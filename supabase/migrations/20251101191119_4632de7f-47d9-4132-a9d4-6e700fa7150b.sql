-- Fix Critical Security Issue #1: User Account IDs Publicly Exposed
-- Replace public profile access with user-scoped access

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles 
  FOR SELECT
  USING (auth.uid() = user_id);

-- Fix Critical Security Issue #2: Unrestricted Cache Access
-- Replace overly permissive cache policy with user-scoped access

DROP POLICY IF EXISTS "System can manage cache" ON public.hydration_cache;

CREATE POLICY "Users can manage own cache"
  ON public.hydration_cache 
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bonus: Fix Database Function Security (Issue #7)
-- Add security attributes to prevent search path injection

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;