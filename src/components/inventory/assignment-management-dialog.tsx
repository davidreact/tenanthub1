"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, Package, CheckSquare, Square } from "lucide-react";

interface AssignmentManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  onAssignmentComplete?: () => void;
}

interface TenantProperty {
  id: string;
  tenant_id: string;
  property_id: string;
  lease_start_date: string;
  lease_end_date: string;
  status: string;
  users: {
    id: string;
    full_name: string | null;
    name: string | null;
    email: string | null;
  }[] | null;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  property_id: string;
  current_assignment_id?: string;
  is_currently_assigned?: boolean;
  inventory_photos?: Array<{
    id: string;
    photo_url: string;
    caption: string;
  }>;
}

interface AssignmentItem extends InventoryItem {
  selected: boolean;
  currentTenant?: string;
  assignedCondition?: string;
}

export function AssignmentManagementDialog({
  isOpen,
  onOpenChange,
  propertyId,
  onAssignmentComplete,
}: AssignmentManagementDialogProps) {
  const [tenants, setTenants] = useState<TenantProperty[]>([]);
  const [inventoryItems, setInventoryItems] = useState<AssignmentItem[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, propertyId]);

  useEffect(() => {
    if (selectedTenant) {
      loadInventoryForTenant();
    }
  }, [selectedTenant]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tenants for the property
      const { data: tenantData } = await supabase
        .from("tenant_properties")
        .select(`
          id,
          tenant_id,
          property_id,
          lease_start_date,
          lease_end_date,
          status,
          users!inner (
            id,
            full_name,
            name,
            email
          )
        `)
        .eq("property_id", propertyId || "")
        .eq("status", "active");

      setTenants((tenantData || []) as unknown as TenantProperty[]);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast({
        title: "Error",
        description: "Failed to load tenant data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryForTenant = async () => {
    try {
      // Fetch all inventory for the property
      const { data: items, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          inventory_assignments!inventory_assignments_inventory_item_id_fkey (
            id,
            tenant_property_id,
            assigned_condition,
            returned_date,
            tenant_properties (
              users (
                full_name,
                name,
                email
              )
            )
          )
        `)
        .eq("property_id", propertyId || "")
        .order("name");

      if (error) {
        console.error("Query error:", error);
        throw error;
      }

      // Process items to show assignment status
      const processedItems: AssignmentItem[] = (items || []).map((item: any) => {
        const activeAssignment = item.inventory_assignments?.find(
          (assignment: any) => !assignment.returned_date
        );

        return {
          ...item,
          selected: false,
          currentTenant: activeAssignment
            ? activeAssignment.tenant_properties?.users?.[0]?.full_name ||
              activeAssignment.tenant_properties?.users?.[0]?.name ||
              "Unknown Tenant"
            : undefined,
          assignedCondition: activeAssignment?.assigned_condition,
        };
      });

      setInventoryItems(processedItems);
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory items.",
        variant: "destructive",
      });
    }
  };

  const handleItemSelection = (itemId: string, selected: boolean) => {
    setInventoryItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, selected } : item
      )
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setInventoryItems(prev =>
      prev.map(item => ({
        ...item,
        selected: selected && !item.currentTenant // Only select unassigned items
      }))
    );
  };

  const handleAssignItems = async () => {
    const itemsToAssign = inventoryItems.filter(item => item.selected);

    if (itemsToAssign.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to assign.",
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();

      // Create assignments for selected items
      const assignments = itemsToAssign.map(item => ({
        inventory_item_id: item.id,
        tenant_property_id: selectedTenant,
        assigned_condition: item.condition,
        assigned_by: user?.id,
      }));

      const { error } = await supabase
        .from("inventory_assignments")
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Assignment Complete",
        description: `Successfully assigned ${itemsToAssign.length} item(s) to tenant.`,
      });

      // Refresh data and close dialog
      await loadInventoryForTenant();
      onAssignmentComplete?.();
    } catch (error) {
      console.error("Error assigning items:", error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const assignedItems = inventoryItems.filter(item => item.currentTenant);
  const availableItems = inventoryItems.filter(item => !item.currentTenant);
  const selectedItems = inventoryItems.filter(item => item.selected);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manage Inventory Assignments
          </DialogTitle>
          <DialogDescription>
            Assign inventory items to tenants or manage existing assignments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tenant Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Tenant</label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tenant..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {tenant.users?.[0]?.full_name || tenant.users?.[0]?.name || tenant.users?.[0]?.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTenant && (
            <>
              {/* Assignment Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Available Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {availableItems.length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Already Assigned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {assignedItems.length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Selected for Assignment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedItems.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(true)}
                    disabled={availableItems.length === 0}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All Available
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(false)}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Deselect All
                  </Button>
                </div>
                <Button
                  onClick={handleAssignItems}
                  disabled={selectedItems.length === 0 || assigning}
                >
                  {assigning ? "Assigning..." : `Assign ${selectedItems.length} Item(s)`}
                </Button>
              </div>

              <Separator />

              {/* Inventory Items */}
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {inventoryItems.map((item) => (
                    <Card key={item.id} className={`transition-colors ${item.selected ? 'ring-2 ring-blue-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={(checked) =>
                                handleItemSelection(item.id, checked as boolean)
                              }
                              disabled={!!item.currentTenant}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span className="font-medium">{item.name}</span>
                                <Badge className={getConditionColor(item.condition)}>
                                  {item.condition}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>Location: {item.location || "Not specified"}</span>
                                <span>Qty: {item.quantity}</span>
                                <span>Value: ${item.estimated_value || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {item.currentTenant ? (
                              <div className="text-sm">
                                <div className="text-green-600 font-medium">Assigned to:</div>
                                <div className="text-gray-600">{item.currentTenant}</div>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-green-600">
                                Available
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {inventoryItems.length === 0 && selectedTenant && (
            <div className="text-center py-8 text-gray-500">
              No inventory items found for this property.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
