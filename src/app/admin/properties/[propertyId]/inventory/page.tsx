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
import {
  ArrowLeft,
  Package,
  Plus,
  Edit,
  Trash2,
  Grid,
  Download,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRef } from "react";
import { InventoryCardsView } from "@/components/inventory/inventory-cards-view";
import { InventoryGridView } from "@/components/inventory/inventory-grid-view";
import { BulkEditDialog } from "@/components/inventory/bulk-edit-dialog";
import { EditItemDialog } from "@/components/inventory/edit-item-dialog";
import { PhotoManagementDialog } from "@/components/inventory/photo-management-dialog";
import { InventoryStats } from "@/components/inventory/inventory-stats";

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  notes?: string;
  created_at?: string;
}

interface GridItem {
  id?: string;
  name: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  notes: string;
  property_id: string;
  photo_file?: File | null;
  isNew?: boolean;
  isEdited?: boolean;
}

export default function PropertyInventory() {
  const [property, setProperty] = useState<Property | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "grid">("grid");
  const [isGridDialogOpen, setIsGridDialogOpen] = useState(false);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [importingCSV, setImportingCSV] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [selectedItemForPhotos, setSelectedItemForPhotos] = useState<
    string | null
  >(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const supabase = createClient();
  const { t } = useLanguage();

  useEffect(() => {
    if (propertyId) {
      fetchData();
    }
  }, [propertyId]);

  useEffect(() => {
    if (viewMode === "grid") {
      initializeGridData();
    }
  }, [inventoryItems, viewMode]);

  const fetchData = async () => {
    try {
      // Fetch property details
      const { data: propertyData } = await supabase
        .from("properties")
        .select("id, name, address, status")
        .eq("id", propertyId)
        .single();

      // Fetch inventory items for this property
      const { data: inventoryData } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      // Fetch inventory photos
      const { data: photosData } = await supabase
        .from("inventory_photos")
        .select("*")
        .order("created_at", { ascending: false });

      setProperty(propertyData);
      setInventoryItems(inventoryData || []);
      setPhotos(photosData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeGridData = () => {
    const gridData = inventoryItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      location: item.location || "",
      condition: item.condition || "good",
      quantity: item.quantity || 1,
      estimated_value: item.estimated_value || 0,
      notes: item.notes || "",
      property_id: propertyId,
      isNew: false,
      isEdited: false,
    }));
    setGridItems(gridData);
  };

  const handleExcelImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingCSV(true);
    try {
      const XLSX = await import("xlsx");
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
            name: String(row[0] || `Item ${index + 1}`),
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
            property_id: propertyId,
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
      name: "",
      description: "",
      location: "",
      condition: "good",
      quantity: 1,
      estimated_value: 0,
      notes: "",
      property_id: propertyId,
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
        (item) => item.isNew && item.name.trim(),
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
              name: item.name,
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
            name: item.name,
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

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !selectedItemForPhotos) return;

    setUploadingPhotos(true);
    try {
      for (const file of Array.from(files)) {
        await uploadPhotoForItem(selectedItemForPhotos, file);
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

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const headers = [
        "Name",
        "Description",
        "Location",
        "Condition",
        "Quantity",
        "Estimated Value",
        "Notes",
        "Photo Count",
        "Photo URLs",
      ];

      const data = [
        headers,
        ...inventoryItems.map((item) => {
          const itemPhotos = photos.filter(
            (photo) => photo.inventory_item_id === item.id,
          );
          return [
            item.name,
            item.description || "",
            item.location || "",
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

      const fileName = `inventory-${property?.name || "property"}-${new Date().toISOString().split("T")[0]}.xlsx`;
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

  const exportInventoryReport = async () => {
    try {
      const XLSX = await import("xlsx");

      // Fetch tenant information for this property
      const { data: tenantData } = await supabase
        .from("tenant_properties")
        .select(
          `
          *,
          users (full_name, name, email, telephone_number)
        `,
        )
        .eq("property_id", propertyId);

      // Fetch inventory photos
      const { data: photosData } = await supabase
        .from("inventory_photos")
        .select("*")
        .in(
          "inventory_item_id",
          inventoryItems.map((item) => item.id),
        );

      // Create comprehensive report data
      const reportData = [
        ["PROPERTY INVENTORY REPORT"],
        [""],
        ["Property Information:"],
        ["Property Name:", property?.name || ""],
        ["Address:", property?.address || ""],
        ["Report Date:", new Date().toLocaleDateString()],
        [""],
        ["Current Tenants:"],
        ...(tenantData || []).map((tenant) => [
          "Tenant:",
          tenant.users?.full_name || tenant.users?.name || "N/A",
          "Email:",
          tenant.users?.email || "N/A",
          "Phone:",
          tenant.users?.telephone_number || "N/A",
          "Lease:",
          `${tenant.lease_start_date} to ${tenant.lease_end_date}`,
        ]),
        [""],
        ["INVENTORY ITEMS:"],
        [
          "Name",
          "Description",
          "Location",
          "Condition",
          "Quantity",
          "Estimated Value",
          "Notes",
          "Photo Count",
          "Photo URLs",
        ],
        ...inventoryItems.map((item) => {
          const itemPhotos = (photosData || []).filter(
            (photo) => photo.inventory_item_id === item.id,
          );
          return [
            item.name,
            item.description || "",
            item.location || "",
            item.condition,
            item.quantity,
            item.estimated_value || 0,
            item.notes || "",
            itemPhotos.length,
            itemPhotos.map((photo) => photo.photo_url).join("; "),
          ];
        }),
        [""],
        ["SUMMARY:"],
        ["Total Items:", inventoryItems.length],
        [
          "Total Quantity:",
          inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
        ],
        [
          "Total Estimated Value:",
          `${inventoryItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0).toFixed(2)}`,
        ],
        ["Total Photos:", (photosData || []).length],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");

      const fileName = `inventory-report-${property?.name?.replace(/[^a-zA-Z0-9]/g, "-") || "property"}-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Report Generated",
        description: "Comprehensive inventory report exported successfully.",
      });
    } catch (error) {
      console.error("Error generating inventory report:", error);
      toast({
        title: "Report Error",
        description: "Failed to generate inventory report. Please try again.",
        variant: "destructive",
      });
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
          <p className="mt-4 text-gray-600">
            {t("inventory.loadingInventory")}
          </p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t("common.propertyNotFound")}
          </h2>
          <p className="text-gray-600 mb-4">
            {t("common.propertyNotFoundDescription")}
          </p>
          <Link href="/admin/properties">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.backToProperties")}
            </Button>
          </Link>
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
            href="/admin/properties"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToProperties")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8" />
              {t("inventory.inventory")} - {property.name}
            </h1>
            <p className="text-muted-foreground mt-2">{property.address}</p>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* View Mode Controls */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGridDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportInventoryReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Full Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={importingCSV}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importingCSV ? "Importing..." : "Import Excel"}
                </Button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  ref={csvInputRef}
                  onChange={handleExcelImport}
                  className="hidden"
                />
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
                      <DialogTitle>
                        {t("common.add")} {t("inventory.inventory")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("inventory.managePropertyInventories")}
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
                            parseFloat(
                              formData.get("estimated_value") as string,
                            ) || 0,
                          notes: formData.get("notes") as string,
                        };

                        createInventoryItem(itemData);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">{t("common.name")}</Label>
                          <Input id="name" name="name" required />
                        </div>
                        <div>
                          <Label htmlFor="location">{t("common.location")}</Label>
                          <Input
                            id="location"
                            name="location"
                            placeholder="e.g., Living Room, Kitchen"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">
                          {t("common.description")}
                        </Label>
                        <Textarea id="description" name="description" rows={2} />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="condition">
                            {t("common.condition")}
                          </Label>
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
                          <Label htmlFor="quantity">{t("common.quantity")}</Label>
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
                            {t("common.estimatedValue")}
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
                        <Label htmlFor="notes">{t("common.notes")}</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          rows={2}
                          placeholder="Additional notes or comments"
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        {t("common.add")}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
        {/* Inventory Display */}
        {viewMode === "cards" ? (
          <InventoryCardsView
            t={t}
            filteredItems={inventoryItems.map(item => ({
              ...item,
              property_id: propertyId,
              properties: property ? { name: property.name, address: property.address } : { name: '', address: '' }
            }))}
            photos={photos}
            onPhotoClick={(itemId) => {
              setSelectedItemForPhotos(itemId);
              setIsPhotoDialogOpen(true);
            }}
            onEditClick={(item) => {
              setSelectedItem(item);
              setIsEditDialogOpen(true);
            }}
          />
        ) : (
          <InventoryGridView
            t={t}
            filteredItems={inventoryItems.map(item => ({
              ...item,
              property_id: propertyId,
              properties: property ? { name: property.name, address: property.address } : { name: '', address: '' }
            }))}
            photos={photos}
            onPhotoClick={(itemId) => {
              setSelectedItemForPhotos(itemId);
              setIsPhotoDialogOpen(true);
            }}
            onEditClick={(item) => {
              setSelectedItem(item);
              setIsEditDialogOpen(true);
            }}
          />
        )}
        </div>

        <EditItemDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          selectedItem={selectedItem ? {
            ...selectedItem,
            property_id: propertyId,
            properties: property ? { name: property.name, address: property.address } : { name: '', address: '' }
          } : null}
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

        {inventoryItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("inventory.noInventoryItemsTitle")}
              </h3>
              <p className="text-muted-foreground">
                {t("inventory.noInventoryItemsDescription")}
              </p>
            </CardContent>
          </Card>
        )}

        <InventoryStats
          t={t}
          filteredItems={inventoryItems.map(item => ({
            ...item,
            property_id: propertyId,
            properties: property ? { name: property.name, address: property.address } : { name: '', address: '' }
          }))}
        />

        <BulkEditDialog
          isOpen={isGridDialogOpen}
          onOpenChange={setIsGridDialogOpen}
          gridItems={gridItems}
          setGridItems={setGridItems}
          properties={property ? [property] : []}
          selectedProperty={propertyId}
          onSave={saveGridChanges}
        />
      </div>
    </div>
  );
}
