"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useInventoryActions } from "@/hooks/useInventoryActions";
import { InventoryViewToggle } from "./inventory-view-toggle";
import { InventoryActions } from "./inventory-actions";
import { InventoryCardsView } from "./inventory-cards-view";
import { InventoryGridView } from "./inventory-grid-view";
import { InventoryStats } from "./inventory-stats";
import { BulkEditDialog } from "./bulk-edit-dialog";
import { EditItemDialog } from "./edit-item-dialog";
import { PhotoManagementDialog } from "./photo-management-dialog";
import { AssignmentManagementDialog } from "./assignment-management-dialog";
import {
  InventoryPageConfig,
  InventoryViewMode,
  InventoryItem,
  GridItem,
  Property,
  InventoryPhoto
} from "@/types/inventory";

interface InventoryPageProps extends InventoryPageConfig {
  properties: Property[];
}

export function InventoryPage({
  role,
  scope,
  propertyId,
  showBulkEdit = false,
  showAssignments = false,
  showTenantNotes = false,
  showPhotoManagement = true,
  properties,
}: InventoryPageProps) {
  const [viewMode, setViewMode] = useState<InventoryViewMode>("grid");
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [isGridDialogOpen, setIsGridDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [selectedItemForPhotos, setSelectedItemForPhotos] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { t } = useLanguage();

  // Use hooks based on scope
  const { property, inventoryItems, photos, loading, refetch } = useInventoryData(
    scope === 'property' ? propertyId : undefined
  );

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

  useEffect(() => {
    if (viewMode === "grid") {
      initializeGridData();
    }
  }, [inventoryItems, viewMode]);

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
      isNew: false,
      isEdited: false,
    }));
    setGridItems(gridData);
  };

  const handleSaveGridChanges = async () => {
    await saveGridChanges(gridItems, propertyId || "", () => {
      refetch();
      setIsGridDialogOpen(false);
    });
  };

  const handlePhotoUploadWrapper = async (files: FileList | null) => {
    if (!selectedItemForPhotos) return;
    await handlePhotoUpload(files, selectedItemForPhotos);
    setIsPhotoDialogOpen(false);
    setSelectedItemForPhotos(null);
  };

  const handleExcelImportWrapper = async (file: File) => {
    await handleExcelImport(file, propertyId || "", inventoryItems, (importedItems) => {
      setGridItems(prev => [...prev, ...importedItems]);
    });
  };

  const handleExportExcel = async () => {
    // This would need to be implemented based on the utility functions
    console.log("Export Excel - to be implemented");
  };

  const handleGenerateReport = async () => {
    // This would need to be implemented based on the utility functions
    console.log("Generate Report - to be implemented");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t?.("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <span>📦</span>
            {t?.("inventory.inventory") || "Inventory"}
            {scope === 'property' && property && ` - ${property.name}`}
          </h1>
          <p className="text-muted-foreground mt-2">
            {scope === 'global'
              ? "View and manage all inventory"
              : "View and manage property inventory"
            }
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* View Mode Controls */}
              <InventoryViewToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                t={t}
              />

              {/* Action Buttons */}
              <InventoryActions
                role={role}
                onExportExcel={handleExportExcel}
                onImportExcel={handleExcelImportWrapper}
                onBulkEdit={showBulkEdit ? () => setIsGridDialogOpen(true) : undefined}
                onAssignmentManage={showAssignments ? () => setIsAssignmentDialogOpen(true) : undefined}
                onGenerateReport={role === 'tenant' ? handleGenerateReport : undefined}
                importing={importingCSV}
                t={t}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Display */}
        {viewMode === "cards" ? (
          <InventoryCardsView
            t={t}
            filteredItems={inventoryItems}
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
            filteredItems={inventoryItems}
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

        {/* Stats */}
        <InventoryStats
          t={t}
          filteredItems={inventoryItems}
        />

        {/* Dialogs */}
        {showBulkEdit && (
          <BulkEditDialog
            isOpen={isGridDialogOpen}
            onOpenChange={setIsGridDialogOpen}
            gridItems={gridItems}
            setGridItems={setGridItems}
            properties={scope === 'property' && property ? [property] : properties}
            selectedProperty={propertyId || "all"}
            onSave={handleSaveGridChanges}
          />
        )}

        <EditItemDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          selectedItem={selectedItem}
          photos={photos}
          t={t}
          onSave={(itemData) => selectedItem && updateInventoryItem(selectedItem.id, itemData)}
          onUploadPhotos={async (files) => {
            if (!files || !selectedItem) return;
            await handlePhotoUpload(files, selectedItem.id);
            refetch();
          }}
          onDeletePhoto={async (photoId) => {
            // Photo deletion logic would go here
            console.log("Delete photo:", photoId);
          }}
          uploadingPhotos={uploadingPhotos}
        />

        {showPhotoManagement && (
          <PhotoManagementDialog
            isOpen={isPhotoDialogOpen}
            onOpenChange={setIsPhotoDialogOpen}
            selectedItemId={selectedItemForPhotos}
            photos={photos}
            onUploadPhotos={handlePhotoUploadWrapper}
            onDeletePhoto={async (photoId) => {
              // Photo deletion logic would go here
              console.log("Delete photo:", photoId);
            }}
            uploadingPhotos={uploadingPhotos}
          />
        )}

        {showAssignments && (
          <AssignmentManagementDialog
            isOpen={isAssignmentDialogOpen}
            onOpenChange={setIsAssignmentDialogOpen}
            propertyId={propertyId}
            onAssignmentComplete={() => {
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}