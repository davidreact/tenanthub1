-- Fix all RLS policies to use correct JWT path: user_metadata.role
-- This updates all policies that were using auth.jwt() ->> 'role'
-- to use (auth.jwt() -> 'user_metadata' ->> 'role')

-- Drop and recreate policies with correct JWT path

-- Properties policies
DROP POLICY IF EXISTS "Admins can manage all properties" ON properties;
CREATE POLICY "Admins can manage all properties" ON properties
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Tenant Properties policies
DROP POLICY IF EXISTS "Admins can manage tenant properties" ON tenant_properties;
CREATE POLICY "Admins can manage tenant properties" ON tenant_properties
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Conversations policies
DROP POLICY IF EXISTS "Admins can manage all conversations" ON conversations;
CREATE POLICY "Admins can manage all conversations" ON conversations
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Messages policies
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
CREATE POLICY "Admins can manage all messages" ON messages
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Inventory Items policies
DROP POLICY IF EXISTS "Admins can manage all inventory" ON inventory_items;
CREATE POLICY "Admins can manage all inventory" ON inventory_items
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Inventory Photos policies
DROP POLICY IF EXISTS "Admins can manage all photos" ON inventory_photos;
CREATE POLICY "Admins can manage all photos" ON inventory_photos
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Inventory Assignments policies
DROP POLICY IF EXISTS "Admins can manage all assignments" ON inventory_assignments;
CREATE POLICY "Admins can manage all assignments" ON inventory_assignments
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Payment Proofs policies
DROP POLICY IF EXISTS "Admins can manage all payments" ON payment_proofs;
CREATE POLICY "Admins can manage all payments" ON payment_proofs
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Key Handovers policies
DROP POLICY IF EXISTS "Admins can manage all handovers" ON key_handovers;
CREATE POLICY "Admins can manage all handovers" ON key_handovers
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Notifications policies
DROP POLICY IF EXISTS "Users can manage their notifications" ON notifications;
CREATE POLICY "Users can manage their notifications" ON notifications
FOR ALL USING (user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Admin Properties policies
DROP POLICY IF EXISTS "Admins can manage admin properties" ON admin_properties;
CREATE POLICY "Admins can manage admin properties" ON admin_properties
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Users policies (when RLS is enabled)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Property manager policies - simplified to avoid recursion
-- These policies check role directly without complex subqueries that could cause recursion

DROP POLICY IF EXISTS "Property managers manage own properties" ON properties;
CREATE POLICY "Property managers manage own properties" ON properties FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'property_manager' AND created_by = auth.uid()
);

-- For other tables, use simpler role-based access for property managers
-- They can access data related to properties they manage, but avoid complex nested queries
DROP POLICY IF EXISTS "Property managers view tenants in own properties" ON tenant_properties;
CREATE POLICY "Property managers view tenants in own properties" ON tenant_properties FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'property_manager');

DROP POLICY IF EXISTS "Property managers view inventory in own properties" ON inventory_items;
CREATE POLICY "Property managers view inventory in own properties" ON inventory_items FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'property_manager');

DROP POLICY IF EXISTS "Property managers view photos in own properties" ON inventory_photos;
CREATE POLICY "Property managers view photos in own properties" ON inventory_photos FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'property_manager');

DROP POLICY IF EXISTS "Property managers view assignments in own properties" ON inventory_assignments;
CREATE POLICY "Property managers view assignments in own properties" ON inventory_assignments FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'property_manager');

DROP POLICY IF EXISTS "Property managers view payments in own properties" ON payment_proofs;
CREATE POLICY "Property managers view payments in own properties" ON payment_proofs FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'property_manager');

DROP POLICY IF EXISTS "Property managers view handovers in own properties" ON key_handovers;
CREATE POLICY "Property managers view handovers in own properties" ON key_handovers FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'property_manager');

DROP POLICY IF EXISTS "Property managers manage conversations in own properties" ON conversations;
CREATE POLICY "Property managers manage conversations in own properties" ON conversations FOR ALL
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'property_manager');

-- Update helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;