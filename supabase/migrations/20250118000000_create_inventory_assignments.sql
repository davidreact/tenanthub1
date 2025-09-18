-- Create inventory_assignments table to link inventory items to tenant contracts
CREATE TABLE IF NOT EXISTS public.inventory_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  tenant_property_id UUID NOT NULL REFERENCES public.tenant_properties(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  returned_date DATE,
  assigned_condition VARCHAR(100),
  returned_condition VARCHAR(100),
  assigned_by UUID REFERENCES public.users(id),
  returned_by UUID REFERENCES public.users(id),
  assignment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(inventory_item_id, tenant_property_id, assigned_date),
  CHECK (returned_date IS NULL OR returned_date >= assigned_date)
);

-- Add indexes for performance
CREATE INDEX idx_inventory_assignments_item_id ON inventory_assignments(inventory_item_id);
CREATE INDEX idx_inventory_assignments_tenant_property_id ON inventory_assignments(tenant_property_id);
CREATE INDEX idx_inventory_assignments_dates ON inventory_assignments(assigned_date, returned_date);
CREATE INDEX idx_inventory_assignments_active ON inventory_assignments(inventory_item_id) WHERE returned_date IS NULL;

-- Add helper fields to inventory_items for quick assignment status
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS current_assignment_id UUID REFERENCES inventory_assignments(id);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_currently_assigned BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE inventory_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_assignments
-- Tenants can only see their own assignments
CREATE POLICY "tenants_view_own_assignments" ON inventory_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenant_properties tp
    WHERE tp.id = inventory_assignments.tenant_property_id
    AND tp.tenant_id = auth.uid()
  )
);

-- Admins can see all assignments
CREATE POLICY "admins_view_all_assignments" ON inventory_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- RLS Policies for inventory_items (tenants only see assigned items)
CREATE POLICY "tenants_view_assigned_inventory" ON inventory_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM inventory_assignments ia
    JOIN tenant_properties tp ON ia.tenant_property_id = tp.id
    WHERE ia.inventory_item_id = inventory_items.id
    AND tp.tenant_id = auth.uid()
    AND ia.returned_date IS NULL
  ) OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Function to update inventory item assignment status
CREATE OR REPLACE FUNCTION update_inventory_assignment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the current_assignment_id and is_currently_assigned for the inventory item
  UPDATE inventory_items
  SET
    current_assignment_id = CASE
      WHEN NEW.returned_date IS NULL THEN NEW.id
      ELSE (
        SELECT ia.id FROM inventory_assignments ia
        WHERE ia.inventory_item_id = NEW.inventory_item_id
        AND ia.returned_date IS NULL
        ORDER BY ia.assigned_date DESC
        LIMIT 1
      )
    END,
    is_currently_assigned = CASE
      WHEN NEW.returned_date IS NULL THEN TRUE
      ELSE EXISTS (
        SELECT 1 FROM inventory_assignments ia
        WHERE ia.inventory_item_id = NEW.inventory_item_id
        AND ia.returned_date IS NULL
      )
    END
  WHERE id = NEW.inventory_item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update assignment status
CREATE TRIGGER trigger_update_inventory_assignment_status
AFTER INSERT OR UPDATE OR DELETE ON inventory_assignments
FOR EACH ROW EXECUTE FUNCTION update_inventory_assignment_status();

-- Enable realtime for inventory_assignments
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_assignments;
