-- Fix infinite recursion in user_profiles RLS policies
-- Drop the problematic recursive policies

DROP POLICY IF EXISTS "Users can view own team" ON public.teams;
DROP POLICY IF EXISTS "Managers can view team members" ON public.user_profiles;

-- Recreate "Users can view own team" with SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_team_id(user_id UUID)
RETURNS UUID AS $$
  SELECT team_id FROM public.user_profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE POLICY "Users can view own team"
  ON public.teams FOR SELECT
  USING (id = get_user_team_id(auth.uid()));

-- For manager viewing team members, we'll use a simpler approach
-- Managers can view profiles that share their team_id
-- We need a SECURITY DEFINER function to check if user is a manager
CREATE OR REPLACE FUNCTION public.is_manager_of_team(manager_id UUID, member_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = manager_id
      AND role = 'manager'
      AND team_id = member_team_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE POLICY "Managers can view team members"
  ON public.user_profiles FOR SELECT
  USING (is_manager_of_team(auth.uid(), team_id) OR auth.uid() = id);
