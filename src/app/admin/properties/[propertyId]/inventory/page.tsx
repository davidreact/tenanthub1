"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../../../supabase/client";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useInventoryActions } from "@/hooks/useInventoryActions";
import { generateInventoryReport } from "@/utils/inventory/pdfGenerator";
import { exportToExcel, exportInventoryReport } from "@/utils/inventory/excelExporter";
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
  Users,
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
import { AssignmentManagementDialog } from "@/components/inventory/assignment-management-dialog";

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface InventoryItem {
  id: string;
  item: string;
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
  item: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  notes?: string;
  property_id: string;
  photo_file?: File | null;
  isNew?: boolean;
  isEdited?: boolean;
}

export default function PropertyInventory() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "grid">("grid");
  const [isGridDialogOpen, setIsGridDialogOpen] = useState(false);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [selectedItemForPhotos, setSelectedItemForPhotos] = useState<
    string | null
  >(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const supabase = createClient();

  // Use custom hooks
  const { property, inventoryItems, photos, loading, refetch } = useInventoryData(propertyId);
  const {
    uploadingPhotos,
    importingCSV,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    handlePhotoUpload,
    saveGridChanges,
    handleExcelImport,
  } = useInventoryActions();
  const { t } = useLanguage();

  useEffect(() => {
    if (propertyId) {
      refetch();
    }
  }, [propertyId]);

  useEffect(() => {
    if (viewMode === "grid") {
      initializeGridData();
    }
  }, [inventoryItems, viewMode]);

  // Wrapper functions for event handlers
  const handleExcelImportWrapper = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Ensure grid is initialized with current inventory data
    const currentGridItems = gridItems.length === 0
      ? inventoryItems.map((item) => ({
          id: item.id,
          item: item.item,
          description: item.description || "",
          location: item.location || "",
          condition: item.condition || "good",
          quantity: item.quantity || 1,
          estimated_value: item.estimated_value || 0,
          notes: item.notes || "",
          property_id: propertyId,
          isNew: false,
          isEdited: false,
        }))
      : [...gridItems];

    await handleExcelImport(file, propertyId, inventoryItems, (importedItems) => {
      const updatedGrid = [...currentGridItems];

      importedItems.forEach((importedItem) => {
        if (importedItem.isNew) {
          // Add new item
          updatedGrid.push(importedItem);
        } else if (importedItem.id && importedItem.isEdited) {
          // Update existing item
          const existingIndex = updatedGrid.findIndex(item => item.id === importedItem.id);
          if (existingIndex >= 0) {
            // Update existing item
            updatedGrid[existingIndex] = { ...updatedGrid[existingIndex], ...importedItem };
          } else {
            // Item doesn't exist in grid, add it
            updatedGrid.push(importedItem);
          }
        }
      });

      setGridItems(updatedGrid);
    });

    if (csvInputRef.current) {
      csvInputRef.current.value = "";
    }
  };

  const handlePhotoUploadWrapper = async (files: FileList | null) => {
    await handlePhotoUpload(files, selectedItemForPhotos);
    setIsPhotoDialogOpen(false);
    setSelectedItemForPhotos(null);
  };

  const handleSaveGridChanges = async () => {
    await saveGridChanges(gridItems, propertyId, () => {
      refetch();
      setIsGridDialogOpen(false);
    });
  };

  const handleExportToExcel = async () => {
    await exportToExcel(inventoryItems, photos, property, toast);
  };

  const handleExportInventoryReport = async () => {
    await exportInventoryReport(property, inventoryItems, photos, toast);
  };


  const handleGeneratePDF = async () => {
    // Fetch tenant data for PDF
    const { data: tenantData } = await supabase
      .from("tenant_properties")
      .select(`
        *,
        users (full_name, name, email, telephone_number)
      `)
      .eq("property_id", propertyId);

    await generateInventoryReport(property, inventoryItems, tenantData, photos);
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
      property_id: propertyId,
      isNew: false,
      isEdited: false,
    }));
    setGridItems(gridData);
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
      property_id: propertyId,
      isNew: true,
      isEdited: false,
    };
    setGridItems((prev) => [...prev, newItem]);
  };

  const removeGridRow = (index: number) => {
    setGridItems((prev) => prev.filter((_, i) => i !== index));
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
            {t?.("inventory.loadingInventory") || "Loading inventory..."}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignmentDialogOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Tenant
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF Report
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
                  onChange={handleExcelImportWrapper}
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
                        {t?.("inventory.managePropertyInventories") || "Manage property inventories"}
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const itemData = {
                          item: formData.get("item") as string,
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
                          <Label htmlFor="item">{t("common.item")}</Label>
                          <Input id="item" name="item" required />
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
            await handlePhotoUpload(files, selectedItem.id);
            refetch();
          }}
          onDeletePhoto={async (photoId) => {
            try {
              await supabase.from("inventory_photos").delete().eq("id", photoId);
              refetch();
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
          onUploadPhotos={handlePhotoUploadWrapper}
          onDeletePhoto={async (photoId) => {
            try {
              await supabase.from("inventory_photos").delete().eq("id", photoId);
              refetch();
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

        <AssignmentManagementDialog
          isOpen={isAssignmentDialogOpen}
          onOpenChange={setIsAssignmentDialogOpen}
          propertyId={propertyId}
          onAssignmentComplete={() => {
            refetch();
            toast({
              title: "Assignments Updated",
              description: "Inventory assignments have been updated successfully.",
            });
          }}
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
          onSave={handleSaveGridChanges}
        />
      </div>
    </div>
  );
}
