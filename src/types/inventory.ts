// Shared types for inventory functionality across admin and tenant contexts

export interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
  tenants?: TenantInventory[];
}

export interface TenantInventory {
  id: string;
  tenant_property_id: string;
  full_name: string;
  email: string;
  lease_status: string;
  assigned_items: number;
  total_value: number;
}

export interface InventoryItem {
  id: string;
  item: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  property_id: string;
  notes?: string;
  created_at?: string;
  properties?: {
    name: string;
    address: string;
  };
  assigned_date?: string;
  assigned_condition?: string;
  assignment_notes?: string;
  inventory_photos?: Array<{
    id: string;
    photo_url: string;
    caption: string;
    uploaded_by?: string;
  }>;
}

export interface GridItem {
  id?: string;
  item: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  property_id: string;
  notes?: string;
  photo_references?: string;
  photo_file?: File | null;
  isNew?: boolean;
  isEdited?: boolean;
}

export interface InventoryFilters {
  searchTerm: string;
  selectedProperty: string;
  condition?: string;
}

export interface InventoryPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  inventory_item_id: string;
  uploaded_by?: string;
}

export interface AssignmentItem extends InventoryItem {
  selected: boolean;
  currentTenant?: string;
  assignedCondition?: string;
}

export type InventoryViewMode = 'cards' | 'grid';
export type InventoryRole = 'admin' | 'tenant';
export type InventoryScope = 'global' | 'property';

export interface InventoryPageConfig {
  role: InventoryRole;
  scope: InventoryScope;
  propertyId?: string;
  showBulkEdit?: boolean;
  showAssignments?: boolean;
  showTenantNotes?: boolean;
  showPhotoManagement?: boolean;
}