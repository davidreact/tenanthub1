-- User Approval System and Property Manager Support
-- Simplified implementation with minimal schema changes

-- Enable RLS on users table (critical security requirement)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add user approval status tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add approval tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add property ownership tracking for property managers
ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Update existing users to approved status (for existing users)
UPDATE users SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);

-- Update RLS policies to include property manager role
-- (Extending existing policies from comprehensive RLS migration)

-- Allow property managers to manage properties they created (JWT-based)
DROP POLICY IF EXISTS "Property managers manage own properties" ON properties;
CREATE POLICY "Property managers manage own properties" ON properties FOR ALL
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND created_by = auth.uid()
);

-- Allow property managers to view tenants in their properties (JWT-based)
DROP POLICY IF EXISTS "Property managers view tenants in own properties" ON tenant_properties;
CREATE POLICY "Property managers view tenants in own properties" ON tenant_properties FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND
  property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
);

-- Allow property managers to view inventory in their properties (JWT-based)
DROP POLICY IF EXISTS "Property managers view inventory in own properties" ON inventory_items;
CREATE POLICY "Property managers view inventory in own properties" ON inventory_items FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND
  property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
);

-- Allow property managers to view inventory photos for their properties
DROP POLICY IF EXISTS "Property managers view photos in own properties" ON inventory_photos;
CREATE POLICY "Property managers view photos in own properties" ON inventory_photos FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND
  inventory_item_id IN (
    SELECT id FROM inventory_items
    WHERE property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
  )
);

-- Allow property managers to view inventory assignments for their properties
DROP POLICY IF EXISTS "Property managers view assignments in own properties" ON inventory_assignments;
CREATE POLICY "Property managers view assignments in own properties" ON inventory_assignments FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND
  tenant_property_id IN (
    SELECT id FROM tenant_properties
    WHERE property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
  )
);

-- Allow property managers to view payment proofs for their properties
DROP POLICY IF EXISTS "Property managers view payments in own properties" ON payment_proofs;
CREATE POLICY "Property managers view payments in own properties" ON payment_proofs FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND
  tenant_property_id IN (
    SELECT id FROM tenant_properties
    WHERE property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
  )
);

-- Allow property managers to view key handovers for their properties
DROP POLICY IF EXISTS "Property managers view handovers in own properties" ON key_handovers;
CREATE POLICY "Property managers view handovers in own properties" ON key_handovers FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND
  tenant_property_id IN (
    SELECT id FROM tenant_properties
    WHERE property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
  )
);

-- Allow property managers to manage conversations for their properties
DROP POLICY IF EXISTS "Property managers manage conversations in own properties" ON conversations;
CREATE POLICY "Property managers manage conversations in own properties" ON conversations FOR ALL
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND (
    tenant_id IN (
      SELECT tp.tenant_id FROM tenant_properties tp
      WHERE tp.property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
    ) OR
    property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
  )
);

-- Allow property managers to manage messages in their conversations
DROP POLICY IF EXISTS "Property managers manage messages in own conversations" ON messages;
CREATE POLICY "Property managers manage messages in own conversations" ON messages FOR ALL
USING (
  auth.jwt() ->> 'role' = 'property_manager' AND
  conversation_id IN (
    SELECT id FROM conversations
    WHERE tenant_id IN (
      SELECT tp.tenant_id FROM tenant_properties tp
      WHERE tp.property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
    ) OR property_id IN (SELECT id FROM properties WHERE created_by = auth.uid())
  )
);

-- Comments for documentation
COMMENT ON COLUMN users.status IS 'User approval status: pending, approved, rejected';
COMMENT ON COLUMN users.approved_by IS 'Admin who approved this user';
COMMENT ON COLUMN users.approved_at IS 'When user was approved';
COMMENT ON COLUMN properties.created_by IS 'Property manager who created this property';