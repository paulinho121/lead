
-- Fix recursive RLS policy on profiles table
-- This recursion happens when a policy on 'profiles' tries to select from 'profiles'

BEGIN;

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Users can only see profiles from their organization" ON profiles;

-- 2. Create a non-recursive policy for users to manage their own profile
-- This is safe because it only compares 'id' with 'auth.uid()'
CREATE POLICY "Users can manage own profile" ON profiles
FOR ALL USING (id = auth.uid());

-- 3. Create a policy for users to see others in their organization
-- We use a subquery that targets the organization_id of the CURRENT user.
-- To minimize recursion risk, we can use a function with SECURITY DEFINER or
-- simply rely on the fact that 'p' is an alias and some versions of Postgres handle this.
-- However, the most robust way in Supabase is using a function that bypasses RLS for the lookup.

CREATE OR REPLACE FUNCTION public.get_auth_organization_id()
RETURNS uuid AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Users can see team members" ON profiles
FOR SELECT USING (
  organization_id = public.get_auth_organization_id()
);

-- 4. Fix organizations policy if it also has issues (though it shouldn't if it's on a different table)
-- But let's use the function there too for consistency and performance
DROP POLICY IF EXISTS "Users can only see their own organization" ON organizations;
CREATE POLICY "Users can see their own organization" ON organizations
FOR SELECT USING (
  id = public.get_auth_organization_id()
);

-- 5. Fix lead isolation policy to use the function (faster)
DROP POLICY IF EXISTS "Users can only see leads from their organization" ON leads;
CREATE POLICY "Users can only see leads from their organization" ON leads
FOR ALL USING (
  organization_id = public.get_auth_organization_id()
);

COMMIT;
