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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Package, Camera, MessageSquare, Grid, Download, Upload, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { InventoryCardsView } from "@/components/inventory/inventory-cards-view";
import { InventoryGridView } from "@/components/inventory/inventory-grid-view";
import { PhotoCaptureDialog } from "@/components/inventory/photo-capture-dialog";
import { PhotoManagementDialog } from "@/components/inventory/photo-management-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { useInventoryReport } from "@/components/inventory/inventory-report-generator";
import { formatTranslation } from "@/lib/i18n";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  condition: string;
  location: string;
  quantity: number;
  estimated_value: number;
  property_id: string;
  notes?: string;
  created_at?: string;
  properties: {
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

export default function TenantInventory() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [notes, setNotes] = useState("");
  const [tenantNotes, setTenantNotes] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "grid">("grid");
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedItemForPhotos, setSelectedItemForPhotos] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [importingCSV, setImportingCSV] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const supabase = createClient();
  const { printReport } = useInventoryReport();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Get tenant's active property first
      const { data: tenantProperty } = await supabase
        .from("tenant_properties")
        .select("id")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .single();

      if (!tenantProperty) return;

      // Get tenant's assigned inventory items
      const { data: items } = await supabase
        .from("inventory_assignments")
        .select(`
          *,
          inventory_items!inventory_assignments_inventory_item_id_fkey (
            *,
            inventory_photos (*),
            properties (name, address)
          )
        `)
        .eq("tenant_property_id", tenantProperty.id)
        .is("returned_date", null)
        .order("assigned_date", { ascending: false });

      const formattedItems = items?.map(item => ({
        ...item.inventory_items,
        assigned_date: item.assigned_date,
        assigned_condition: item.assigned_condition,
        assignment_notes: item.assignment_notes
      })) || [];

      setInventoryItems(formattedItems);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemNotes = async (itemId: string, newNotes: string) => {
    try {
      await supabase
        .from("inventory_items")
        .update({ notes: newNotes })
        .eq("id", itemId);

      // Update local state
      setInventoryItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, notes: newNotes } : item,
        ),
      );

      toast({
        title: "Notes Updated",
        description: "Your notes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating notes:", error);
      toast({
        title: "Error",
        description: "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateTenantNotes = async (assignmentId: string, tenantNotes: string) => {
    try {
      // Find the assignment record for this item and tenant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenantProperty } = await supabase
        .from("tenant_properties")
        .select("id")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .single();

      if (!tenantProperty) return;

      await supabase
        .from("inventory_assignments")
        .update({ assignment_notes: tenantNotes })
        .eq("inventory_item_id", assignmentId)
        .eq("tenant_property_id", tenantProperty.id);

      // Update local state
      setInventoryItems((items) =>
        items.map((item) =>
          item.id === assignmentId ? { ...item, assignment_notes: tenantNotes } : item,
        ),
      );

      toast({
        title: "Notes Updated",
        description: "Your notes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating tenant notes:", error);
      toast({
        title: "Error",
        description: "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openNotesDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setNotes(item.notes || "");
    setTenantNotes(item.assignment_notes || "");
    setIsNotesDialogOpen(true);
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const importedItems: Partial<InventoryItem>[] = [];

      dataRows.forEach((row) => {
        if (row.length >= 2 && row[0]) {
          importedItems.push({
            name: String(row[0] || ""),
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
          });
        }
      });

      if (importedItems.length > 0) {
        // Get current user's tenant property
        const { data: { user } } = await supabase.auth.getUser();
        const { data: tenantProperty } = await supabase
          .from("tenant_properties")
          .select("id, property_id")
          .eq("tenant_id", user?.id)
          .eq("status", "active")
          .single();

        if (tenantProperty) {
          // Insert new items
          const itemsToInsert = importedItems.map(item => ({
            ...item,
            property_id: tenantProperty.property_id,
          }));

          const { data: insertedItems, error } = await supabase
            .from("inventory_items")
            .insert(itemsToInsert)
            .select();

          if (error) throw error;

          // Create assignments for the new items
          if (insertedItems) {
            const assignments = insertedItems.map(item => ({
              inventory_item_id: item.id,
              tenant_property_id: tenantProperty.id,
              assigned_condition: item.condition,
            }));

            await supabase.from("inventory_assignments").insert(assignments);
          }

          await fetchInventoryItems();
          toast({
            title: "Import Successful",
            description: `Added ${importedItems.length} items to your inventory.`,
          });
        }
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



  const exportToExcel = async () => {
    try {
      const headers = [
        "Name",
        "Description",
        "Location",
        "Condition",
        "Quantity",
        "Estimated Value",
        "Notes",
        "Assigned Date",
        "Photo Count",
      ];

      const data = [
        headers,
        ...inventoryItems.map((item) => [
          item.name,
          item.description || "",
          item.location || "",
          item.condition,
          item.quantity,
          item.estimated_value || 0,
          item.notes || "",
          item.assigned_date || "",
          item.inventory_photos?.length || 0,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "My Inventory");

      const fileName = `my-inventory-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Complete",
        description: "Your inventory has been exported to Excel successfully.",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export Error",
        description: "Failed to export inventory. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !selectedItemForPhotos) return;

    setUploadingPhotos(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const timestamp = Date.now();
        const fileName = `inventory-${selectedItemForPhotos}-${timestamp}.${fileExt}`;
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
            uploaded_by: user.id,
          });

        if (dbError) throw dbError;
      }

      await fetchInventoryItems();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("inventory.loadingInventory")}</p>
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
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToDashboard")}
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-8 w-8" />
            {t("inventory.inventory")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("inventory.viewManageProperty")}
          </p>
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
                  {t("inventory.cardsView")}
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  {t("inventory.gridView")}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printReport(inventoryItems)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t("common.printReport")}
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("common.exportExcel")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={importingCSV}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importingCSV ? t("common.importing") : t("common.importExcel")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <input
          type="file"
          accept=".xlsx,.xls"
          ref={csvInputRef}
          onChange={handleExcelImport}
          className="hidden"
        />

        {/* Inventory Display */}
        {viewMode === "cards" ? (
          <InventoryCardsView
            t={t}
            filteredItems={inventoryItems}
            photos={inventoryItems.flatMap(item =>
              (item.inventory_photos || []).map(photo => ({
                ...photo,
                inventory_item_id: item.id
              }))
            )}
            onPhotoClick={(itemId) => {
              setSelectedItemForPhotos(itemId);
              setIsPhotoDialogOpen(true);
            }}
            onEditClick={(item) => openNotesDialog(item)}
          />
        ) : (
          <InventoryGridView
            t={t}
            filteredItems={inventoryItems}
            photos={inventoryItems.flatMap(item =>
              (item.inventory_photos || []).map(photo => ({
                ...photo,
                inventory_item_id: item.id
              }))
            )}
            onPhotoClick={(itemId) => {
              setSelectedItemForPhotos(itemId);
              setIsPhotoDialogOpen(true);
            }}
            onEditClick={(item) => openNotesDialog(item)}
          />
        )}

        {inventoryItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("inventory.noInventoryItemsTitle")}
              </h3>
              <p className="text-gray-600">
                {t("inventory.noInventoryItemsForProperty")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center">
          <Button size="lg" className="px-8">
            {t("inventory.signDocument")}
          </Button>
        </div>

        {/* Combined Notes Dialog */}
        <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{formatTranslation("inventory.itemNotesTitle", language, { name: selectedItem?.name || "" })}</DialogTitle>
              <DialogDescription>
                {t("inventory.itemNotesDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Admin Notes Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t("common.adminNotes")}</Label>
                <Textarea
                  value={notes}
                  readOnly
                  placeholder={t("common.noAdminNotes")}
                  className="min-h-20 bg-gray-50"
                />
              </div>

              {/* Tenant Notes Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t("common.yourNotes")}</Label>
                <Textarea
                  value={tenantNotes}
                  onChange={(e) => setTenantNotes(e.target.value)}
                  placeholder={t("common.addYourNotesPlaceholder")}
                  className="min-h-20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsNotesDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={async () => {
                    if (selectedItem && tenantNotes !== selectedItem.assignment_notes) {
                      await updateTenantNotes(selectedItem.id, tenantNotes);
                    }
                    setIsNotesDialogOpen(false);
                  }}
                >
                  {t("common.saveNotes")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <PhotoManagementDialog
          isOpen={isPhotoDialogOpen}
          onOpenChange={setIsPhotoDialogOpen}
          selectedItemId={selectedItemForPhotos}
          photos={inventoryItems.flatMap(item =>
            (item.inventory_photos || []).map(photo => ({
              ...photo,
              inventory_item_id: item.id
            }))
          )}
          onUploadPhotos={handlePhotoUpload}
          onDeletePhoto={async (photoId) => {
            if (!currentUserId) return;
            await supabase
              .from("inventory_photos")
              .delete()
              .eq("id", photoId)
              .eq("uploaded_by", currentUserId);
            await fetchInventoryItems();
            toast({
              title: "Photo Deleted",
              description: "Photo has been removed.",
            });
          }}
          uploadingPhotos={uploadingPhotos}
          canDelete={(photo) => !!currentUserId && photo.uploaded_by === currentUserId}
        />

      </div>
    </div>
  );
}
