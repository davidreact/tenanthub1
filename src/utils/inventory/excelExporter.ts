import { useToast } from "@/components/ui/use-toast";
import { Property, InventoryItem } from "@/types/inventory";

interface Photo {
  inventory_item_id: string;
  photo_url: string;
  caption?: string;
}

export const exportToExcel = async (
  inventoryItems: InventoryItem[],
  photos: Photo[],
  property: Property | null,
  toast: ReturnType<typeof useToast>['toast']
) => {
  try {
    const XLSX = await import("xlsx");

    // Create headers (Item ID will be hidden)
    const headers = [
      "Item ID",
      "Item",
      "Description",
      "Location",
      "Condition",
      "Quantity",
      "Estimated Value",
      "Notes",
    ];

    // Create data rows
    const dataRows = inventoryItems.map((item) => [
      item.id, // Use actual database ID (will be hidden)
      item.item,
      item.description || "",
      item.location || "",
      item.condition,
      item.quantity,
      item.estimated_value || 0,
      item.notes || "",
    ]);

    // Create empty rows for new item entry (10 rows)
    const emptyRows = Array(10).fill([
      "", // Empty Item ID for new items
      "", // Item
      "", // Description
      "", // Location
      "good", // Default condition
      1, // Default quantity
      0, // Default value
      "", // Notes
    ]);

    // Combine all data
    const allData = [headers, ...dataRows, ...emptyRows];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Configure column properties
    worksheet['!cols'] = [
      { hidden: true, width: 0 }, // Item ID (hidden)
      { width: 20 },              // Item
      { width: 30 },              // Description
      { width: 15 },              // Location
      { width: 12 },              // Condition
      { width: 10 },              // Quantity
      { width: 12 },              // Value
      { width: 25 },              // Notes
    ];

    // Add table styling (borders)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:H1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellRef]) continue;

        // Add border styling
        worksheet[cellRef].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
          // Header row styling (bold, background)
          ...(row === 0 && {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E6E6FA' } }, // Light purple background
          }),
        };
      }
    }

    // Add data validation for condition column (D column, index 3)
    worksheet['!dataValidation'] = [
      {
        sqref: `E2:E${inventoryItems.length + 11}`, // Condition column, from row 2 to end
        allowBlank: true,
        showDropDown: true,
        values: ['excellent', 'good', 'fair', 'poor'],
      },
    ];

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    // Generate filename
    const fileName = `inventory-${property?.name?.replace(/[^a-zA-Z0-9]/g, "-") || "property"}-${new Date().toISOString().split("T")[0]}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Export Complete",
      description: "Professional inventory Excel file exported successfully.",
    });

    return fileName;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    toast({
      title: "Export Error",
      description: "Failed to export to Excel. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

export const exportInventoryReport = async (
  property: Property | null,
  inventoryItems: InventoryItem[],
  photos: Photo[],
  toast: ReturnType<typeof useToast>['toast']
) => {
  try {
    const XLSX = await import("xlsx");

    // Create comprehensive report data
    const reportData = [
      ["PROPERTY INVENTORY REPORT"],
      [""],
      ["Property Information:"],
      ["Property Name:", property?.name || ""],
      ["Address:", property?.address || ""],
      ["Report Date:", new Date().toLocaleDateString()],
      [""],
      ["INVENTORY ITEMS:"],
      [
        "Item ID",
        "Item",
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
        const itemPhotos = photos.filter(
          (photo) => photo.inventory_item_id === item.id,
        );
        return [
          item.id, // Use actual database ID
          item.item,
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
        `$${inventoryItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0).toFixed(2)}`,
      ],
      ["Total Photos:", photos.length],
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

    return fileName;
  } catch (error) {
    console.error("Error generating inventory report:", error);
    toast({
      title: "Report Error",
      description: "Failed to generate inventory report. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};