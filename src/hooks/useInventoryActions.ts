import { useState } from "react";
import { createClient } from "../../supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getTranslation } from "../lib/i18n";
import { InventoryItem, GridItem } from "@/types/inventory";

export const useInventoryActions = () => {
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [importingCSV, setImportingCSV] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const createInventoryItem = async (itemData: Partial<InventoryItem>) => {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Item Added",
        description: "Inventory item has been created successfully.",
      });

      return data;
    } catch (error) {
      console.error("Error creating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to create inventory item. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>) => {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .update(itemData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Item Updated",
        description: "Inventory item has been updated successfully.",
      });

      return data;
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory item. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;

    try {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);

      if (error) throw error;

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
      throw error;
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

      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

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

  const handlePhotoUpload = async (files: FileList | null, selectedItemId: string | null) => {
    if (!files || !selectedItemId) return;

    setUploadingPhotos(true);
    try {
      for (const file of Array.from(files)) {
        await uploadPhotoForItem(selectedItemId, file);
      }

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
    }
  };

  const saveGridChanges = async (
    gridItems: GridItem[],
    propertyId: string,
    onSuccess: () => void
  ) => {
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

      toast({
        title: "Changes Saved",
        description: `Updated ${itemsToUpdate.length} items and added ${itemsToInsert.length} new items.`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error saving grid changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExcelImport = async (
    file: File,
    propertyId: string,
    inventoryItems: InventoryItem[],
    onSuccess: (items: GridItem[]) => void
  ) => {
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
      const importedItems: GridItem[] = [];
      let updatedCount = 0;
      let newCount = 0;

      dataRows.forEach((row, index) => {
        // Skip empty rows
        if (!row || row.length === 0 || !row[1]) return; // Check item name (column 1)

        console.log(`Row ${index} - Processing row with ${row.length} columns`);

        let itemData: Partial<GridItem>;
        let existingId: string | undefined;
        let isUpdate = false;

        if (row.length >= 8) {
          // Format: Item ID, Item, Description, Location, Condition, Quantity, Value, Notes
          // This could be from the new styled export (with hidden Item ID) or old format
          const itemId = String(row[0] || "").trim();
          const itemName = String(row[1] || `Item ${index + 1}`);

          // Check if first column contains a valid database ID (UUID)
          if (itemId && itemId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // This is an existing item - use the ID for updating
            existingId = itemId;
            isUpdate = true;
            console.log(`Row ${index} - Found existing item with ID: ${itemId}`);
          } else {
            // No valid ID or empty - treat as new item
            console.log(`Row ${index} - Treating as new item (no valid ID found)`);
          }

          itemData = {
            id: existingId,
            item: itemName,
            description: String(row[2] || ""),
            location: String(row[3] || ""),
            condition: ["excellent", "good", "fair", "poor"].includes(
              String(row[4])?.toLowerCase(),
            )
              ? String(row[4]).toLowerCase()
              : "good",
            quantity: parseInt(String(row[5])) || 1,
            estimated_value: parseFloat(String(row[6])) || 0,
            notes: String(row[7] || ""),
            property_id: propertyId,
            isNew: !isUpdate,
            isEdited: isUpdate,
          };
        } else if (row.length >= 7) {
          // Fallback: Format without Item ID: Item, Description, Location, Condition, Quantity, Value, Notes
          // This could be from old Excel files or manual entry
          const itemName = String(row[0] || `Item ${index + 1}`);

          // Try to find existing item by name + location for backward compatibility
          const existingItem = inventoryItems.find(item =>
            item.item === itemName && (item.location || "") === (row[2] || "")
          );

          if (existingItem) {
            existingId = existingItem.id;
            isUpdate = true;
            console.log(`Row ${index} - Found existing item by name/location match: ${itemName}`);
          }

          itemData = {
            id: existingId,
            item: itemName,
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
            isNew: !isUpdate,
            isEdited: isUpdate,
          };
        } else {
          // Skip rows that don't have enough data
          console.log(`Row ${index} - Skipping due to insufficient data (length: ${row.length})`);
          return;
        }

        // Only add if item name is not empty
        if (itemData.item && itemData.item.trim()) {
          importedItems.push(itemData as GridItem);
          if (isUpdate) {
            updatedCount++;
            console.log(`Row ${index} - Added update for existing item: ${itemData.item}`);
          } else {
            newCount++;
            console.log(`Row ${index} - Added new item: ${itemData.item}`);
          }
        }
      });

      if (importedItems.length > 0) {
        const actionText = updatedCount > 0 ? getTranslation("common.clickBulkEditToSave") : "Items added to grid";
        toast({
          title: getTranslation("common.excelImportedSuccessfully"),
          description: `Processed ${importedItems.length} items (${newCount} new, ${updatedCount} updates). ${actionText}`,
        });
        onSuccess(importedItems);
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
    }
  };

  return {
    uploadingPhotos,
    importingCSV,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    handlePhotoUpload,
    saveGridChanges,
    handleExcelImport,
  };
};