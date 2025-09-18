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
  DialogTrigger,
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
  property_id: string;
  notes?: string;
  created_at?: string;
  properties: {
    name: string;
    address: string;
  };
}

interface InventoryPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  inventory_item_id: string;
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
  photo_references?: string;
  photo_file?: File | null;
  isNew?: boolean;
  isEdited?: boolean;
}

export default function AdminInventory() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [photos, setPhotos] = useState<InventoryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
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
      // Fetch properties
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("*")
        .order("name");

      // Fetch all inventory items with property info
      const { data: inventoryData } = await supabase
        .from("inventory_items")
        .select(
          `
          *,
          properties (name, address)
        `,
        )
        .order("created_at", { ascending: false });

      // Fetch inventory photos
      const { data: photosData } = await supabase
        .from("inventory_photos")
        .select("*")
        .order("created_at", { ascending: false });

      setProperties(propertiesData || []);
      setInventoryItems(inventoryData || []);
      setPhotos(photosData || []);
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
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      name: item.name,
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
          name: columns[0] || `Item ${index + 1}`,
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
      name: "",
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
        "Name",
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
            item.name,
            item.description || "",
            item.location || "",
            item.properties.name,
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
              {t("inventory.inventoryManagement")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("inventory.managePropertyInventories")}
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t("common.filter")}</CardTitle>
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("common.property")}
                </label>
                <Select
                  value={selectedProperty}
                  onValueChange={setSelectedProperty}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All {t("common.property")}
                    </SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("common.search")} Items
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={`${t("common.search")} by ${t("common.name")}, ${t("common.description")}, or ${t("common.location")}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total {t("common.quantity")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalQuantity()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("common.estimatedValue")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${getTotalValue().toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {properties.map((property) => {
            const propertyItems = inventoryItems.filter(
              (item) => item.property_id === property.id,
            );
            const propertyValue = propertyItems.reduce(
              (sum, item) => sum + (item.estimated_value || 0),
              0,
            );

            return (
              <Card
                key={property.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {property.name}
                  </CardTitle>
                  <CardDescription>{property.address}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Items:</span>
                      <p className="font-medium">{propertyItems.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {t("common.value")}:
                      </span>
                      <p className="font-medium">${propertyValue.toFixed(2)}</p>
                    </div>
                  </div>

                  <Link href={`/admin/properties/${property.id}/inventory`}>
                    <Button className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      {t("inventory.inventoryManagement")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Inventory Items */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedProperty === "all"
              ? `All ${t("inventory.inventory")} Items`
              : "Filtered Items"}
          </h2>

          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const itemPhotos = photos.filter(
                  (photo) => photo.inventory_item_id === item.id,
                );
                return (
                  <Card
                    key={item.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge className={getConditionColor(item.condition)}>
                          {item.condition}
                        </Badge>
                      </div>
                      <CardDescription>
                        {item.properties.name} • {item.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {itemPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {itemPhotos.slice(0, 4).map((photo) => (
                            <img
                              key={photo.id}
                              src={photo.photo_url}
                              alt={photo.caption || item.name}
                              className="w-full h-20 object-cover rounded cursor-pointer"
                              onClick={() => {
                                setSelectedItemForPhotos(item.id);
                                setIsPhotoDialogOpen(true);
                              }}
                            />
                          ))}
                          {itemPhotos.length > 4 && (
                            <div
                              className="bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600 cursor-pointer"
                              onClick={() => {
                                setSelectedItemForPhotos(item.id);
                                setIsPhotoDialogOpen(true);
                              }}
                            >
                              +{itemPhotos.length - 4} more
                            </div>
                          )}
                        </div>
                      )}

                      {item.description && (
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">
                            {t("common.quantity")}:
                          </span>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("common.value")}:
                          </span>
                          <p className="font-medium">
                            ${item.estimated_value || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedItemForPhotos(item.id);
                            setIsPhotoDialogOpen(true);
                          }}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Photos ({itemPhotos.length})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Name</TableHead>
                        <TableHead className="w-40">Description</TableHead>
                        <TableHead className="w-24">Location</TableHead>
                        <TableHead className="w-32">Property</TableHead>
                        <TableHead className="w-24">Condition</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-24">Value</TableHead>
                        <TableHead className="w-32">Notes</TableHead>
                        <TableHead className="w-32">Photos</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => {
                        const itemPhotos = photos.filter(
                          (photo) => photo.inventory_item_id === item.id,
                        );
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.properties.name}</TableCell>
                            <TableCell>
                              <Badge
                                className={getConditionColor(item.condition)}
                              >
                                {item.condition}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.estimated_value || 0}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedItemForPhotos(item.id);
                                  setIsPhotoDialogOpen(true);
                                }}
                              >
                                <ImageIcon className="h-4 w-4 mr-1" />
                                {itemPhotos.length}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No {t("inventory.inventory")} Items
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedProperty !== "all"
                  ? "No items match your current filters."
                  : `No ${t("inventory.inventory")} items have been added yet.`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Grid Edit Dialog */}
        <Dialog open={isGridDialogOpen} onOpenChange={setIsGridDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Bulk Inventory Editor</DialogTitle>
              <DialogDescription>
                Edit multiple items at once. Paste from Excel (Ctrl+V) or add
                rows manually. Expected columns: Name, Description, Location,
                Condition, Quantity, Value, Notes, Photo References
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <div className="mb-4 flex gap-2">
                <Button onClick={addNewGridRow} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
                <Button onClick={saveGridChanges} size="sm">
                  Save Changes
                </Button>
              </div>
              <div
                className="overflow-auto max-h-[60vh] border rounded"
                onPaste={handlePasteFromExcel}
                tabIndex={0}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Name</TableHead>
                      <TableHead className="w-40">Description</TableHead>
                      <TableHead className="w-24">Location</TableHead>
                      <TableHead className="w-32">Property</TableHead>
                      <TableHead className="w-24">Condition</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-24">Value</TableHead>
                      <TableHead className="w-32">Notes</TableHead>
                      <TableHead className="w-32">Photo</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gridItems.map((item, index) => (
                      <TableRow
                        key={index}
                        className={
                          item.isNew
                            ? "bg-green-50"
                            : item.isEdited
                              ? "bg-yellow-50"
                              : ""
                        }
                      >
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              handleGridCellChange(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              handleGridCellChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.location}
                            onChange={(e) =>
                              handleGridCellChange(
                                index,
                                "location",
                                e.target.value,
                              )
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.property_id}
                            onValueChange={(value) =>
                              handleGridCellChange(index, "property_id", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map((property) => (
                                <SelectItem
                                  key={property.id}
                                  value={property.id}
                                >
                                  {property.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.condition}
                            onValueChange={(value) =>
                              handleGridCellChange(index, "condition", value)
                            }
                          >
                            <SelectTrigger className="w-full">
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
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleGridCellChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.estimated_value}
                            onChange={(e) =>
                              handleGridCellChange(
                                index,
                                "estimated_value",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.notes}
                            onChange={(e) =>
                              handleGridCellChange(
                                index,
                                "notes",
                                e.target.value,
                              )
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleGridCellChange(index, "photo_file", file);
                              }}
                              className="w-full text-xs"
                            />
                            {item.photo_file && (
                              <span className="text-xs text-green-600 whitespace-nowrap">
                                ✓
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGridRow(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <strong>Tip:</strong> Copy data from Excel and paste here
                  (Ctrl+V). Green rows are new, yellow rows are edited.
                </p>
                <p>
                  <strong>Photos:</strong> Upload photos directly in the Photo
                  column. They will be saved when you save changes.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update item information and manage photos
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const itemData = {
                    name: formData.get("name") as string,
                    description: formData.get("description") as string,
                    location: formData.get("location") as string,
                    condition: formData.get("condition") as string,
                    quantity: parseInt(formData.get("quantity") as string) || 1,
                    estimated_value:
                      parseFloat(formData.get("estimated_value") as string) ||
                      0,
                    notes: formData.get("notes") as string,
                  };

                  updateInventoryItem(selectedItem.id, itemData);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">{t("common.name")}</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedItem.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-location">
                      {t("common.location")}
                    </Label>
                    <Input
                      id="edit-location"
                      name="location"
                      defaultValue={selectedItem.location}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">
                    {t("common.description")}
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
                    <Label htmlFor="edit-condition">
                      {t("common.condition")}
                    </Label>
                    <Select
                      name="condition"
                      defaultValue={selectedItem.condition}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label htmlFor="edit-quantity">
                      {t("common.quantity")}
                    </Label>
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
                      {t("common.estimatedValue")}
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
                  <Label htmlFor="edit-notes">{t("common.notes")}</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={selectedItem.notes}
                    rows={2}
                  />
                </div>

                {/* Photo Management Section */}
                <div className="space-y-4">
                  <div>
                    <Label>Upload New Photos</Label>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
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
                        }
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Current Photos</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {photos
                        .filter(
                          (photo) =>
                            photo.inventory_item_id === selectedItem.id,
                        )
                        .map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.photo_url}
                              alt={photo.caption || "Inventory photo"}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await supabase
                                      .from("inventory_photos")
                                      .delete()
                                      .eq("id", photo.id);
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
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {photo.caption && (
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploadingPhotos}
                >
                  {uploadingPhotos
                    ? "Uploading Photos..."
                    : t("common.saveChanges")}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Photo Management Dialog */}
        <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Manage Photos</DialogTitle>
              <DialogDescription>
                Upload new photos or view existing ones for this inventory item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Upload New Photos</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhotos}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingPhotos ? "Uploading..." : "Browse"}
                  </Button>
                </div>
              </div>

              {selectedItemForPhotos && (
                <div>
                  <Label>Existing Photos</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {photos
                      .filter(
                        (photo) =>
                          photo.inventory_item_id === selectedItemForPhotos,
                      )
                      .map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || "Inventory photo"}
                            className="w-full h-32 object-cover rounded border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await supabase
                                    .from("inventory_photos")
                                    .delete()
                                    .eq("id", photo.id);
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
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {photo.caption && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {photo.caption}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
