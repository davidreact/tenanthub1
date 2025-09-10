"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../../../supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Package, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface Property {
  id: string;
  name: string;
  address: string;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  notes: string;
  created_at: string;
}

export default function PropertyInventory() {
  const [property, setProperty] = useState<Property | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const supabase = createClient();

  useEffect(() => {
    if (propertyId) {
      fetchData();
    }
  }, [propertyId]);

  const fetchData = async () => {
    try {
      // Fetch property details
      const { data: propertyData } = await supabase
        .from("properties")
        .select("id, name, address")
        .eq("id", propertyId)
        .single();

      // Fetch inventory items for this property
      const { data: inventoryData } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      setProperty(propertyData);
      setInventoryItems(inventoryData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createInventoryItem = async (itemData: Partial<InventoryItem>) => {
    try {
      await supabase
        .from("inventory_items")
        .insert({ ...itemData, property_id: propertyId });

      fetchData(); // Refresh the list
      setIsCreateDialogOpen(false);

      toast({
        title: "Item Added",
        description: "Inventory item has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to create inventory item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateInventoryItem = async (
    id: string,
    itemData: Partial<InventoryItem>,
  ) => {
    try {
      await supabase.from("inventory_items").update(itemData).eq("id", id);

      fetchData(); // Refresh the list
      setIsEditing(false);
      setSelectedItem(null);
      setIsEditDialogOpen(false);

      toast({
        title: "Item Updated",
        description: "Inventory item has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteInventoryItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?"))
      return;

    try {
      await supabase.from("inventory_items").delete().eq("id", id);

      fetchData(); // Refresh the list

      toast({
        title: "Item Deleted",
        description: "Inventory item has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Property Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested property could not be found.
          </p>
          <Link href="/admin/properties">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/properties"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-8 w-8" />
                Inventory for {property.name}
              </h1>
              <p className="text-gray-600 mt-2">{property.address}</p>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to the property inventory
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const itemData = {
                      name: formData.get("name") as string,
                      description: formData.get("description") as string,
                      location: formData.get("location") as string,
                      condition: formData.get("condition") as string,
                      quantity:
                        parseInt(formData.get("quantity") as string) || 1,
                      estimated_value:
                        parseFloat(formData.get("estimated_value") as string) ||
                        0,
                      notes: formData.get("notes") as string,
                    };

                    createInventoryItem(itemData);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Item Name</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="e.g., Living Room, Kitchen"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={2} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="condition">Condition</Label>
                      <Select name="condition" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        defaultValue="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimated_value">
                        Estimated Value ($)
                      </Label>
                      <Input
                        id="estimated_value"
                        name="estimated_value"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      placeholder="Additional notes or comments"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Add Item
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge className={getConditionColor(item.condition)}>
                    {item.condition}
                  </Badge>
                </div>
                {item.location && (
                  <CardDescription>{item.location}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {item.description && (
                  <p className="text-sm text-gray-600">{item.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <p className="font-medium">{item.quantity}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Value:</span>
                    <p className="font-medium">${item.estimated_value || 0}</p>
                  </div>
                </div>

                {item.notes && (
                  <div className="bg-gray-50 p-2 rounded text-sm">
                    <span className="text-gray-500">Notes:</span>
                    <p className="text-gray-700 mt-1">{item.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsEditing(true);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Inventory Item</DialogTitle>
                        <DialogDescription>
                          Update item information
                        </DialogDescription>
                      </DialogHeader>
                      {selectedItem && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const itemData = {
                              name: formData.get("name") as string,
                              description: formData.get(
                                "description",
                              ) as string,
                              location: formData.get("location") as string,
                              condition: formData.get("condition") as string,
                              quantity:
                                parseInt(formData.get("quantity") as string) ||
                                1,
                              estimated_value:
                                parseFloat(
                                  formData.get("estimated_value") as string,
                                ) || 0,
                              notes: formData.get("notes") as string,
                            };

                            updateInventoryItem(selectedItem.id, itemData);
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-name">Item Name</Label>
                              <Input
                                id="edit-name"
                                name="name"
                                defaultValue={selectedItem.name}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-location">Location</Label>
                              <Input
                                id="edit-location"
                                name="location"
                                defaultValue={selectedItem.location}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="edit-description">
                              Description
                            </Label>
                            <Textarea
                              id="edit-description"
                              name="description"
                              defaultValue={selectedItem.description}
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="edit-condition">Condition</Label>
                              <Select
                                name="condition"
                                defaultValue={selectedItem.condition}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="excellent">
                                    Excellent
                                  </SelectItem>
                                  <SelectItem value="good">Good</SelectItem>
                                  <SelectItem value="fair">Fair</SelectItem>
                                  <SelectItem value="poor">Poor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="edit-quantity">Quantity</Label>
                              <Input
                                id="edit-quantity"
                                name="quantity"
                                type="number"
                                min="1"
                                defaultValue={selectedItem.quantity}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-estimated_value">
                                Estimated Value ($)
                              </Label>
                              <Input
                                id="edit-estimated_value"
                                name="estimated_value"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={selectedItem.estimated_value}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="edit-notes">Notes</Label>
                            <Textarea
                              id="edit-notes"
                              name="notes"
                              defaultValue={selectedItem.notes}
                              rows={2}
                            />
                          </div>

                          <Button type="submit" className="w-full">
                            Update Item
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteInventoryItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {inventoryItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Inventory Items
              </h3>
              <p className="text-gray-600">
                Add your first inventory item to get started.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Quantity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inventoryItems.reduce(
                  (sum, item) => sum + (item.quantity || 0),
                  0,
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Estimated Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {inventoryItems
                  .reduce((sum, item) => sum + (item.estimated_value || 0), 0)
                  .toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
