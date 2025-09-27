-- Correct RLS Policies for public.users table
-- Uses correct JWT path: user_metadata.role (verified from decoded JWT)
-- This recreates all necessary policies after user deleted existing ones

-- Enable RLS on public.users table (CRITICAL for security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (safety check)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.users;

-- Policy 1: Users can view their own data
CREATE POLICY "Users can view own data" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own basic data (but not status/role)
CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent users from changing their own status or role
  status = (SELECT status FROM public.users WHERE id = auth.uid()) AND
  role = (SELECT role FROM public.users WHERE id = auth.uid())
);

-- Policy 3: Admins can view all users (using correct JWT path)
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Policy 4: Admins can update all user data (including status and role)
CREATE POLICY "Admins can update all users" ON public.users
FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Policy 5: Allow authenticated users to insert (for registration/profile creation)
CREATE POLICY "Authenticated users can insert" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Documentation comments
COMMENT ON TABLE public.users IS 'Custom user profiles with RLS enabled for role-based access control';
COMMENT ON POLICY "Admins can view all users" ON public.users IS 'Admins (role=admin in JWT user_metadata) have full read access to all user profiles';
COMMENT ON POLICY "Users can view own data" ON public.users IS 'Users can only see their own profile data via auth.uid()';

-- Verify policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;