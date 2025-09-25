"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../../supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from "xlsx";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Package,
  Building,
  Search,
  Upload,
  Grid,
  Download,
  Image as ImageIcon,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryStats } from "@/components/inventory/inventory-stats";
import { InventoryCardsView } from "@/components/inventory/inventory-cards-view";
import { InventoryGridView } from "@/components/inventory/inventory-grid-view";
import { BulkEditDialog } from "@/components/inventory/bulk-edit-dialog";
import { EditItemDialog } from "@/components/inventory/edit-item-dialog";
import { PhotoManagementDialog } from "@/components/inventory/photo-management-dialog";
import { Property, TenantInventory, InventoryItem, InventoryPhoto, GridItem } from "@/types/inventory";

export default function AdminInventory() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [photos, setPhotos] = useState<InventoryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "grid">("grid");
  const [isGridDialogOpen, setIsGridDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [selectedItemForPhotos, setSelectedItemForPhotos] = useState<
    string | null
  >(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [importingCSV, setImportingCSV] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [inventoryItems, selectedProperty, searchTerm]);

  useEffect(() => {
    if (viewMode === "grid") {
      initializeGridData();
    }
  }, [inventoryItems, viewMode]);

  const fetchData = async () => {
    try {
      // Fetch properties with tenant inventory summaries
      const { data: propertiesData } = await supabase
        .from("properties")
        .select(`
          id,
          name,
          address,
          status
        `)
        .order("name");

      if (!propertiesData) {
        setProperties([]);
        setLoading(false);
        return;
      }

      // For each property, get tenant inventory summaries
      const propertiesWithTenants = await Promise.all(
        propertiesData.map(async (property) => {
          console.log(`Fetching tenants for property: ${property.name}`);

          const { data: tenantData, error: tenantError } = await supabase
            .from("tenant_properties")
            .select(`
              id,
              tenant_id,
              status,
              users (
                id,
                full_name,
                name,
                email
              )
            `)
            .eq("property_id", property.id)
            .eq("status", "active");

          console.log(`Tenants for ${property.name}:`, { tenantData, tenantError });

          if (!tenantData || tenantData.length === 0) {
            return { ...property, tenants: [] };
          }

          // For each tenant, get their inventory summary
          const tenantsWithInventory = await Promise.all(
            tenantData.map(async (tenant) => {
              // tenant.users is expected to be an object from the Supabase join
              const user = tenant.users as any;
console.log(`Fetching assignments for tenant: ${user?.full_name || user?.name || 'Unknown'}`);

              const { data: assignments, error: assignmentError } = await supabase
                .from("inventory_assignments")
                .select(`
                  id,
                  inventory_items!inventory_assignments_inventory_item_id_fkey (
                    estimated_value
                  )
                `)
                .eq("tenant_property_id", tenant.id)
                .is("returned_date", null);

              const assignedItems = assignments?.length || 0;
              const totalValue = assignments?.reduce(
                (sum, assignment) => {
                  const value = parseFloat((assignment.inventory_items as any)?.estimated_value) || 0;
                  return sum + value;
                },
                0
              ) || 0;

              const tenantInfo = {
id: user?.id || tenant.tenant_id,
                tenant_property_id: tenant.id,
full_name: user?.full_name || user?.name || "Unnamed Tenant",
email: user?.email || "",
                lease_status: tenant.status,
                assigned_items: assignedItems,
                total_value: totalValue,
              };

              console.log(`Tenant info:`, tenantInfo);
              return tenantInfo;
            })
          );

          const filteredTenants = tenantsWithInventory.filter(tenant => tenant.assigned_items > 0);
          console.log(`Final tenants with assignments for ${property.name}:`, filteredTenants);

          return {
            ...property,
            tenants: filteredTenants
          };
        })
      );

      setProperties(propertiesWithTenants);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = inventoryItems;
  
    // Filter by property
    if (selectedProperty !== "all") {
      filtered = filtered.filter(
        (item) => item.property_id === selectedProperty,
      );
    }
  
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
  
    setFilteredItems(filtered);
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

  const getTotalValue = () => {
    return filteredItems.reduce(
      (sum, item) => sum + (item.estimated_value || 0),
      0,
    );
  };

  const getTotalQuantity = () => {
    return filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const initializeGridData = () => {
    const gridData = inventoryItems.map((item) => ({
      id: item.id,
      item: item.item,
      description: item.description || "",
      location: item.location || "",
      condition: item.condition || "good",
      quantity: item.quantity || 1,
      estimated_value: item.estimated_value || 0,
      notes: item.notes || "",
      property_id: item.property_id,
      photo_references: getPhotoReferences(item.id),
      isNew: false,
      isEdited: false,
    }));
    setGridItems(gridData);
  };

  const getPhotoReferences = (itemId: string) => {
    const itemPhotos = photos.filter(
      (photo) => photo.inventory_item_id === itemId,
    );
    return itemPhotos.map((photo) => photo.photo_url).join(", ");
  };

  const handleExcelImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingCSV(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as any[][];

      if (jsonData.length === 0) {
        toast({
          title: "Error",
          description: "Excel file is empty.",
          variant: "destructive",
        });
        return;
      }

      // Skip header row if it exists
      const dataRows = jsonData.slice(1);
      const newItems: GridItem[] = [];

      dataRows.forEach((row, index) => {
        if (row.length >= 6 && row[0]) {
          const newItem: GridItem = {
            item: String(row[0] || `Item ${index + 1}`),
            description: String(row[1] || ""),
            location: String(row[2] || ""),
            condition: ["excellent", "good", "fair", "poor"].includes(
              String(row[3])?.toLowerCase(),
            )
              ? String(row[3]).toLowerCase()
              : "good",
            quantity: parseInt(String(row[4])) || 1,
            estimated_value: parseFloat(String(row[5])) || 0,
            notes: String(row[6] || ""),
            property_id:
              selectedProperty !== "all"
                ? selectedProperty
                : properties[0]?.id || "",
            photo_references: String(row[7] || ""),
            isNew: true,
            isEdited: false,
          };
          newItems.push(newItem);
        }
      });

      if (newItems.length > 0) {
        setGridItems((prev) => [...prev, ...newItems]);
        toast({
          title: "Excel Imported",
          description: `Added ${newItems.length} items from Excel file.`,
        });
      } else {
        toast({
          title: "No Data",
          description: "No valid items found in Excel file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing Excel:", error);
      toast({
        title: "Import Error",
        description: "Failed to import Excel file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setImportingCSV(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  };

  const handlePasteFromExcel = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text");
    const rows = pastedData.split("\n").filter((row) => row.trim());

    if (rows.length === 0) return;

    const newItems: GridItem[] = [];

    rows.forEach((row, index) => {
      const columns = row.split("\t");
      if (columns.length >= 6) {
        const newItem: GridItem = {
          item: columns[0] || `Item ${index + 1}`,
          description: columns[1] || "",
          location: columns[2] || "",
          condition: ["excellent", "good", "fair", "poor"].includes(
            columns[3]?.toLowerCase(),
          )
            ? columns[3].toLowerCase()
            : "good",
          quantity: parseInt(columns[4]) || 1,
          estimated_value: parseFloat(columns[5]) || 0,
          notes: columns[6] || "",
          property_id:
            selectedProperty !== "all"
              ? selectedProperty
              : properties[0]?.id || "",
          photo_references: columns[7] || "",
          isNew: true,
          isEdited: false,
        };
        newItems.push(newItem);
      }
    });

    setGridItems((prev) => [...prev, ...newItems]);
    toast({
      title: "Data Pasted",
      description: `Added ${newItems.length} items from clipboard.`,
    });
  };

  const handleGridCellChange = (
    index: number,
    field: keyof GridItem,
    value: any,
  ) => {
    setGridItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [field]: value,
            isEdited: !item.isNew,
          };
        }
        return item;
      }),
    );
  };

  const addNewGridRow = () => {
    const newItem: GridItem = {
      item: "",
      description: "",
      location: "",
      condition: "good",
      quantity: 1,
      estimated_value: 0,
      notes: "",
      property_id:
        selectedProperty !== "all" ? selectedProperty : properties[0]?.id || "",
      photo_references: "",
      isNew: true,
      isEdited: false,
    };
    setGridItems((prev) => [...prev, newItem]);
  };

  const removeGridRow = (index: number) => {
    setGridItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveGridChanges = async () => {
    try {
      const itemsToInsert = gridItems.filter(
        (item) => item.isNew && item.item.trim(),
      );
      const itemsToUpdate = gridItems.filter(
        (item) => item.isEdited && item.id,
      );
  
      // Insert new items
      if (itemsToInsert.length > 0) {
        const { data: insertedItems, error: insertError } = await supabase
          .from("inventory_items")
          .insert(
            itemsToInsert.map((item) => ({
              item: item.item,
              description: item.description,
              location: item.location,
              condition: item.condition,
              quantity: item.quantity,
              estimated_value: item.estimated_value,
              notes: item.notes,
              property_id: item.property_id,
            })),
          )
          .select();
  
        if (insertError) throw insertError;
  
        // Handle photo uploads for new items
        if (insertedItems) {
          for (let i = 0; i < itemsToInsert.length; i++) {
            const item = itemsToInsert[i];
            const insertedItem = insertedItems[i];
  
            if (item.photo_file && insertedItem) {
              await uploadPhotoForItem(insertedItem.id, item.photo_file);
            }
          }
        }
      }
  
      // Update existing items
      for (const item of itemsToUpdate) {
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({
            item: item.item,
            description: item.description,
            location: item.location,
            condition: item.condition,
            quantity: item.quantity,
            estimated_value: item.estimated_value,
            notes: item.notes,
            property_id: item.property_id,
          })
          .eq("id", item.id);
  
        if (updateError) throw updateError;
  
        // Handle photo uploads for updated items
        if (item.photo_file && item.id) {
          await uploadPhotoForItem(item.id, item.photo_file);
        }
      }
  
      await fetchData();
      setIsGridDialogOpen(false);
  
      toast({
        title: "Changes Saved",
        description: `Updated ${itemsToUpdate.length} items and added ${itemsToInsert.length} new items.`,
      });
    } catch (error) {
      console.error("Error saving grid changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const uploadPhotoForItem = async (itemId: string, file: File) => {
    try {
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `inventory-${itemId}-${timestamp}.${fileExt}`;
      const filePath = `inventory/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("inventory_photos")
        .insert({
          inventory_item_id: itemId,
          photo_url: publicUrl,
          caption: `${file.name} (${fileName})`,
        });

      if (dbError) throw dbError;
    } catch (error) {
      console.error("Error uploading photo:", error);
      throw error;
    }
  };

  const updateInventoryItem = async (
    id: string,
    itemData: Partial<InventoryItem>,
  ) => {
    try {
      await supabase.from("inventory_items").update(itemData).eq("id", id);

      fetchData(); // Refresh the list
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

  const exportToExcel = async () => {
    try {
      const headers = [
        "ITEM",
        "Description",
        "Location",
        "Property",
        "Condition",
        "Quantity",
        "Estimated Value",
        "Notes",
        "Photo Count",
        "Photo URLs",
      ];
  
      const data = [
        headers,
        ...filteredItems.map((item) => {
          const itemPhotos = photos.filter(
            (photo) => photo.inventory_item_id === item.id,
          );
          return [
            item.item,
            item.description || "",
            item.location || "",
            item.properties?.name || "Unknown Property",
            item.condition,
            item.quantity,
            item.estimated_value || 0,
            item.notes || "",
            itemPhotos.length,
            itemPhotos.map((photo) => photo.photo_url).join("; "),
          ];
        }),
      ];
  
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
  
      const fileName = `inventory-${selectedProperty === "all" ? "all-properties" : "filtered"}-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
  
      toast({
        title: "Export Complete",
        description: "Inventory exported to Excel successfully.",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export Error",
        description: "Failed to export to Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !selectedItemForPhotos) return;

    setUploadingPhotos(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${selectedItemForPhotos}-${Date.now()}.${fileExt}`;
        const filePath = `inventory/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("inventory_photos")
          .insert({
            inventory_item_id: selectedItemForPhotos,
            photo_url: publicUrl,
            caption: file.name,
          });

        if (dbError) throw dbError;
      }

      await fetchData();
      toast({
        title: "Photos Uploaded",
        description: `Successfully uploaded ${files.length} photo(s).`,
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhotos(false);
      setIsPhotoDialogOpen(false);
      setSelectedItemForPhotos(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToDashboard")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-8 w-8" />
                {t("adminInventory.inventoryOverview")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("adminInventory.viewAssignmentsDescription")}
              </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-xs text-muted-foreground">{t("adminInventory.properties")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {properties.reduce((sum, prop) => sum + (prop.tenants?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">{t("adminInventory.tenantsWithInventory")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {properties.reduce((sum, prop) =>
                  sum + (prop.tenants?.reduce((tSum, tenant) => tSum + tenant.assigned_items, 0) || 0), 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("adminInventory.itemsAssigned")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                ${properties.reduce((sum, prop) =>
                  sum + (prop.tenants?.reduce((tSum, tenant) => tSum + tenant.total_value, 0) || 0), 0
                ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">{t("adminInventory.totalValue")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Property Inventory Overview */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">{t("adminInventory.assignmentsByProperty")}</h2>

          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {property.name}
                </CardTitle>
                <CardDescription>{property.address}</CardDescription>
              </CardHeader>
              <CardContent>
                {(property.tenants?.length || 0) > 0 ? (
                  <div className="space-y-4">
                    {property.tenants?.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="border rounded-lg p-4 bg-muted transition-colors hover:bg-muted/80"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="mb-2">
                              <h4 className="font-medium">
                                {tenant.full_name} ({tenant.email || 'No email'}) - {tenant.lease_status}
                              </h4>
                            </div>
                            <div className="flex gap-6 text-sm mb-2">
                              <span className="bg-muted px-2 py-1 rounded">
                                <strong className="text-blue-700">{tenant.assigned_items}</strong> {t("adminInventory.itemsAssignedText")}
                              </span>
                              <span className="bg-muted px-2 py-1 rounded">
                                <strong className="text-green-700">${tenant.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> {t("adminInventory.totalValueText")}
                              </span>
                            </div>
                          </div>
                          <Link href={`/admin/properties/${property.id}/inventory`}>
                            <Button variant="outline" size="sm">
                              <Package className="h-4 w-4 mr-2" />
                              {t("adminInventory.viewInventoryDetails")}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t("adminInventory.noTenantsWithInventory")}</p>
                    <Link href={`/admin/properties/${property.id}/inventory`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        {t("adminInventory.managePropertyInventory")}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {properties.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {t("adminInventory.noPropertiesFound")}
                </h3>
                <p className="text-muted-foreground">
                  {t("adminInventory.createPropertiesFirst")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <BulkEditDialog
          isOpen={isGridDialogOpen}
          onOpenChange={setIsGridDialogOpen}
          gridItems={gridItems}
          setGridItems={setGridItems}
          properties={properties}
          selectedProperty={selectedProperty}
          onSave={saveGridChanges}
        />

        <EditItemDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          selectedItem={selectedItem}
          photos={photos}
          t={t}
          onSave={(itemData) => selectedItem && updateInventoryItem(selectedItem.id, itemData)}
          onUploadPhotos={async (files) => {
            if (!files || !selectedItem) return;
            setUploadingPhotos(true);
            try {
              for (const file of Array.from(files)) {
                await uploadPhotoForItem(selectedItem.id, file);
              }
              await fetchData();
              toast({
                title: "Photos Uploaded",
                description: `Successfully uploaded ${files.length} photo(s).`,
              });
            } catch (error) {
              toast({
                title: "Upload Error",
                description: "Failed to upload photos.",
                variant: "destructive",
              });
            } finally {
              setUploadingPhotos(false);
            }
          }}
          onDeletePhoto={async (photoId) => {
            try {
              await supabase.from("inventory_photos").delete().eq("id", photoId);
              await fetchData();
              toast({
                title: "Photo Deleted",
                description: "Photo has been removed.",
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to delete photo.",
                variant: "destructive",
              });
            }
          }}
          uploadingPhotos={uploadingPhotos}
        />

        <PhotoManagementDialog
          isOpen={isPhotoDialogOpen}
          onOpenChange={setIsPhotoDialogOpen}
          selectedItemId={selectedItemForPhotos}
          photos={photos}
          onUploadPhotos={handlePhotoUpload}
          onDeletePhoto={async (photoId) => {
            try {
              await supabase.from("inventory_photos").delete().eq("id", photoId);
              await fetchData();
              toast({
                title: "Photo Deleted",
                description: "Photo has been removed.",
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to delete photo.",
                variant: "destructive",
              });
            }
          }}
          uploadingPhotos={uploadingPhotos}
        />


      </div>
    </div>
  );
}
