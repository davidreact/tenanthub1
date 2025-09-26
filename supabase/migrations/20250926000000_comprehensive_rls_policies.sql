-- Comprehensive Row Level Security (RLS) Policies Implementation
-- This migration enables RLS on all tables and creates appropriate policies
-- for admin and tenant access control

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

-- Users table (keep disabled for auth triggers, but add policies)
-- Note: RLS is disabled on users table to allow auth triggers to work
-- But we still create policies for when it's enabled

-- Properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Tenant Properties table
ALTER TABLE tenant_properties ENABLE ROW LEVEL SECURITY;

-- Conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Inventory Items table
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Inventory Photos table
ALTER TABLE inventory_photos ENABLE ROW LEVEL SECURITY;

-- Inventory Assignments table
ALTER TABLE inventory_assignments ENABLE ROW LEVEL SECURITY;

-- Payment Proofs table
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

-- Key Handovers table
ALTER TABLE key_handovers ENABLE ROW LEVEL SECURITY;

-- Notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User Preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Admin Properties table
ALTER TABLE admin_properties ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (if any)
-- =====================================================

-- Properties policies
DROP POLICY IF EXISTS "Admins can manage all properties" ON properties;
DROP POLICY IF EXISTS "Tenants can view their properties" ON properties;

-- Tenant Properties policies
DROP POLICY IF EXISTS "Admins can manage tenant properties" ON tenant_properties;
DROP POLICY IF EXISTS "Tenants can view their leases" ON tenant_properties;

-- Conversations policies
DROP POLICY IF EXISTS "Admins can manage all conversations" ON conversations;
DROP POLICY IF EXISTS "Tenants can manage their conversations" ON conversations;

-- Messages policies
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP POLICY IF EXISTS "Users can manage their messages" ON messages;

-- Inventory Items policies
DROP POLICY IF EXISTS "Admins can manage all inventory" ON inventory_items;
DROP POLICY IF EXISTS "Tenants can view their assigned inventory" ON inventory_items;

-- Inventory Photos policies
DROP POLICY IF EXISTS "Admins can manage all photos" ON inventory_photos;
DROP POLICY IF EXISTS "Users can view photos for accessible inventory" ON inventory_photos;

-- Inventory Assignments policies
DROP POLICY IF EXISTS "Admins can manage all assignments" ON inventory_assignments;
DROP POLICY IF EXISTS "Tenants can view their assignments" ON inventory_assignments;

-- Payment Proofs policies
DROP POLICY IF EXISTS "Admins can manage all payments" ON payment_proofs;
DROP POLICY IF EXISTS "Tenants can manage their payments" ON payment_proofs;

-- Key Handovers policies
DROP POLICY IF EXISTS "Admins can manage all handovers" ON key_handovers;
DROP POLICY IF EXISTS "Tenants can view their handovers" ON key_handovers;

-- Notifications policies
DROP POLICY IF EXISTS "Users can manage their notifications" ON notifications;

-- User Preferences policies
DROP POLICY IF EXISTS "Users can manage their preferences" ON user_preferences;

-- Admin Properties policies
DROP POLICY IF EXISTS "Admins can manage admin properties" ON admin_properties;

-- =====================================================
-- CREATE COMPREHENSIVE RLS POLICIES
-- =====================================================

-- =====================================================
-- PROPERTIES TABLE POLICIES
-- =====================================================

-- Admins can do everything with properties
CREATE POLICY "Admins can manage all properties" ON properties
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Tenants can only view properties they are associated with
CREATE POLICY "Tenants can view their properties" ON properties
FOR SELECT USING (
  id IN (
    SELECT property_id FROM tenant_properties
    WHERE tenant_id = auth.uid()
  )
);

-- =====================================================
-- TENANT PROPERTIES TABLE POLICIES
-- =====================================================

-- Admins can do everything with tenant relationships
CREATE POLICY "Admins can manage tenant properties" ON tenant_properties
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Tenants can view their own lease information
CREATE POLICY "Tenants can view their leases" ON tenant_properties
FOR SELECT USING (tenant_id = auth.uid());

-- Tenants can update their own lease status (limited)
CREATE POLICY "Tenants can update their lease status" ON tenant_properties
FOR UPDATE USING (tenant_id = auth.uid())
WITH CHECK (
  tenant_id = auth.uid() AND
  -- Only allow status updates that make sense for tenants
  status IN ('active', 'terminated')
);

-- =====================================================
-- CONVERSATIONS TABLE POLICIES
-- =====================================================

-- Admins can manage all conversations
CREATE POLICY "Admins can manage all conversations" ON conversations
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Tenants can manage conversations for their properties
CREATE POLICY "Tenants can manage their conversations" ON conversations
FOR ALL USING (
  tenant_id = auth.uid() OR
  property_id IN (
    SELECT property_id FROM tenant_properties
    WHERE tenant_id = auth.uid()
  )
);

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages" ON messages
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Users can manage messages in conversations they have access to
CREATE POLICY "Users can manage their messages" ON messages
FOR ALL USING (
  sender_id = auth.uid() OR
  conversation_id IN (
    SELECT id FROM conversations
    WHERE tenant_id = auth.uid() OR
    property_id IN (
      SELECT property_id FROM tenant_properties
      WHERE tenant_id = auth.uid()
    )
  )
);

-- =====================================================
-- INVENTORY ITEMS TABLE POLICIES
-- =====================================================

-- Admins can manage all inventory
CREATE POLICY "Admins can manage all inventory" ON inventory_items
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Tenants can view inventory assigned to them
CREATE POLICY "Tenants can view their assigned inventory" ON inventory_items
FOR SELECT USING (
  id IN (
    SELECT inventory_item_id FROM inventory_assignments
    WHERE tenant_property_id IN (
      SELECT id FROM tenant_properties
      WHERE tenant_id = auth.uid()
    )
  )
);

-- =====================================================
-- INVENTORY PHOTOS TABLE POLICIES
-- =====================================================

-- Admins can manage all photos
CREATE POLICY "Admins can manage all photos" ON inventory_photos
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view photos for inventory they can access
CREATE POLICY "Users can view photos for accessible inventory" ON inventory_photos
FOR SELECT USING (
  inventory_item_id IN (
    SELECT id FROM inventory_items
    WHERE id IN (
      SELECT inventory_item_id FROM inventory_assignments
      WHERE tenant_property_id IN (
        SELECT id FROM tenant_properties
        WHERE tenant_id = auth.uid()
      )
    )
  )
);

-- Users can upload photos for inventory they can access
CREATE POLICY "Users can upload photos for accessible inventory" ON inventory_photos
FOR INSERT WITH CHECK (
  inventory_item_id IN (
    SELECT id FROM inventory_items
    WHERE id IN (
      SELECT inventory_item_id FROM inventory_assignments
      WHERE tenant_property_id IN (
        SELECT id FROM tenant_properties
        WHERE tenant_id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- INVENTORY ASSIGNMENTS TABLE POLICIES
-- =====================================================

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments" ON inventory_assignments
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Tenants can view their assignments
CREATE POLICY "Tenants can view their assignments" ON inventory_assignments
FOR SELECT USING (
  tenant_property_id IN (
    SELECT id FROM tenant_properties
    WHERE tenant_id = auth.uid()
  )
);

-- =====================================================
-- PAYMENT PROOFS TABLE POLICIES
-- =====================================================

-- Admins can manage all payment proofs
CREATE POLICY "Admins can manage all payments" ON payment_proofs
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Tenants can manage their own payment proofs
CREATE POLICY "Tenants can manage their payments" ON payment_proofs
FOR ALL USING (
  tenant_property_id IN (
    SELECT id FROM tenant_properties
    WHERE tenant_id = auth.uid()
  )
);

-- =====================================================
-- KEY HANDOVERS TABLE POLICIES
-- =====================================================

-- Admins can manage all handovers
CREATE POLICY "Admins can manage all handovers" ON key_handovers
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Tenants can view handovers for their properties
CREATE POLICY "Tenants can view their handovers" ON key_handovers
FOR SELECT USING (
  tenant_property_id IN (
    SELECT id FROM tenant_properties
    WHERE tenant_id = auth.uid()
  )
);

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can manage their own notifications
CREATE POLICY "Users can manage their notifications" ON notifications
FOR ALL USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- USER PREFERENCES TABLE POLICIES
-- =====================================================

-- Users can manage their own preferences
CREATE POLICY "Users can manage their preferences" ON user_preferences
FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- ADMIN PROPERTIES TABLE POLICIES
-- =====================================================

-- Only admins can access admin properties table
CREATE POLICY "Admins can manage admin properties" ON admin_properties
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- USERS TABLE POLICIES (when RLS is enabled)
-- =====================================================

-- Note: RLS is currently disabled on users table for auth triggers
-- These policies will be active if RLS is ever enabled

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all user data
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- HELPER FUNCTIONS FOR COMPLEX POLICIES
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns tenant property
CREATE OR REPLACE FUNCTION owns_tenant_property(tenant_property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_properties
    WHERE id = tenant_property_id AND tenant_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on auth.users for RLS policies
GRANT SELECT ON auth.users TO authenticated;

-- =====================================================
-- ENABLE REALTIME FOR SECURED TABLES
-- =====================================================

-- Enable realtime for tables that need live updates (skip if already added)
DO $$
BEGIN
    -- Check if conversations is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    END IF;

    -- Check if messages is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;

    -- Check if notifications is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- You can test these policies by running:
-- SELECT * FROM properties; -- Should only return accessible properties
-- SELECT * FROM tenant_properties; -- Should only return user's leases
-- SELECT * FROM conversations; -- Should only return user's conversations

COMMENT ON TABLE properties IS 'Property listings with RLS: admins see all, tenants see their properties';
COMMENT ON TABLE tenant_properties IS 'Tenant-property relationships with RLS: admins manage all, tenants see their leases';
COMMENT ON TABLE conversations IS 'Communication threads with RLS: users see their conversations';
COMMENT ON TABLE messages IS 'Individual messages with RLS: users see messages in accessible conversations';
COMMENT ON TABLE inventory_items IS 'Inventory catalog with RLS: admins manage all, tenants see assigned items';
COMMENT ON TABLE payment_proofs IS 'Payment proof uploads with RLS: users manage their payments';
COMMENT ON TABLE key_handovers IS 'Key handover records with RLS: users see their handovers';