-- Fix RLS on users table - CRITICAL SECURITY FIX
-- This addresses the security advisor warnings about RLS not being enabled

-- Enable RLS on users table (this is critical for security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create proper RLS policies for users table
-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Users can update their own basic data (but not status/role)
CREATE POLICY "Users can update own data" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent users from changing their own status or role
  status = (SELECT status FROM users WHERE id = auth.uid()) AND
  role = (SELECT role FROM users WHERE id = auth.uid())
);

-- Admins can view all users (JWT-based for performance)
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING ((auth.jwt() -> 'raw_user_meta_data' ->> 'role') = 'admin');

-- Admins can update all user data (including status and role)
CREATE POLICY "Admins can update all users" ON users
FOR UPDATE USING ((auth.jwt() -> 'raw_user_meta_data' ->> 'role') = 'admin');

-- Allow authenticated users to insert (for registration)
CREATE POLICY "Authenticated users can insert" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Comments for documentation
COMMENT ON TABLE users IS 'User profiles with RLS enabled for security';
COMMENT ON POLICY "Users can view own data" ON users IS 'Users can only see their own profile data';
COMMENT ON POLICY "Admins can view all users" ON users IS 'Admins have full access to user management';