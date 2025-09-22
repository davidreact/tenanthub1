import { jsPDF } from "jspdf";

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
}

interface Tenant {
  users?: {
    full_name?: string;
    name?: string;
    email?: string;
    telephone_number?: string;
  };
  lease_start_date: string;
  lease_end_date: string;
}

interface Photo {
  inventory_item_id: string;
  photo_url: string;
  caption?: string;
}

export const generateInventoryReport = async (
  property: Property | null,
  inventoryItems: InventoryItem[],
  tenantData: Tenant[] | null,
  photosData: Photo[] | null
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PROPERTY INVENTORY REPORT", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Property Information
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Property Information", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Property Name: ${property?.name || ""}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Address: ${property?.address || ""}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 15;

  // Current Tenants
  if (tenantData && tenantData.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Current Tenants", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    tenantData.forEach((tenant) => {
      checkPageBreak(20);
      const tenantName = tenant.users?.full_name || tenant.users?.name || "N/A";
      const tenantEmail = tenant.users?.email || "N/A";
      const tenantPhone = tenant.users?.telephone_number || "N/A";
      const leasePeriod = `${tenant.lease_start_date} to ${tenant.lease_end_date}`;

      doc.text(`• ${tenantName}`, 25, yPosition);
      yPosition += 5;
      doc.text(`  Email: ${tenantEmail}`, 30, yPosition);
      yPosition += 5;
      doc.text(`  Phone: ${tenantPhone}`, 30, yPosition);
      yPosition += 5;
      doc.text(`  Lease: ${leasePeriod}`, 30, yPosition);
      yPosition += 8;
    });
    yPosition += 5;
  }

  // Inventory Items Table
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Inventory Items", 20, yPosition);
  yPosition += 10;

  // Table headers
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const headers = ["Item", "Description", "Location", "Condition", "Qty", "Value", "Notes"];
  const colWidths = [30, 40, 25, 20, 15, 20, 30];
  let xPos = 20;

  headers.forEach((header, index) => {
    doc.text(header, xPos, yPosition);
    xPos += colWidths[index];
  });
  yPosition += 8;

  // Draw header line
  doc.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
  yPosition += 2;

  // Table rows
  doc.setFont("helvetica", "normal");
  inventoryItems.forEach((item) => {
    checkPageBreak(15);

    const rowData = [
      item.item || "",
      item.description || "",
      item.location || "",
      item.condition || "",
      item.quantity?.toString() || "0",
      `$${item.estimated_value?.toFixed(2) || "0.00"}`,
      item.notes || "",
    ];

    xPos = 20;
    let maxHeight = 0;

    rowData.forEach((data, colIndex) => {
      const lines = doc.splitTextToSize(data, colWidths[colIndex] - 2);
      const height = lines.length * 4;
      maxHeight = Math.max(maxHeight, height);

      doc.text(lines, xPos, yPosition);
      xPos += colWidths[colIndex];
    });

    yPosition += maxHeight + 2;

    // Draw row line
    doc.line(20, yPosition - 1, pageWidth - 20, yPosition - 1);
    yPosition += 1;
  });

  // Photos Section
  if (photosData && photosData.length > 0) {
    checkPageBreak(50);
    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Photos", 20, yPosition);
    yPosition += 10;

    // Group photos by inventory item
    const photosByItem: Record<string, Photo[]> = photosData.reduce((acc, photo) => {
      if (!acc[photo.inventory_item_id]) {
        acc[photo.inventory_item_id] = [];
      }
      acc[photo.inventory_item_id].push(photo);
      return acc;
    }, {} as Record<string, Photo[]>);

    // Display photos for each item
    for (const [itemId, itemPhotos] of Object.entries(photosByItem)) {
      const item = inventoryItems.find(item => item.id === itemId);
      if (!item) continue;

      checkPageBreak(60);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Item: ${item.item}`, 20, yPosition);
      yPosition += 8;

      let photoX = 20;
      const photoWidth = 40;
      const photoHeight = 30;
      const photosPerRow = Math.floor((pageWidth - 40) / (photoWidth + 10));

      for (let i = 0; i < itemPhotos.length; i++) {
        const photo = itemPhotos[i];

        // Check if we need to move to next row
        if (i > 0 && i % photosPerRow === 0) {
          yPosition += photoHeight + 10;
          photoX = 20;
          checkPageBreak(photoHeight + 20);
        }

        try {
          // Add photo placeholder/frame
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.rect(photoX, yPosition, photoWidth, photoHeight);

          // Add photo caption
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          const caption = photo.caption || `Photo ${i + 1}`;
          const captionLines = doc.splitTextToSize(caption, photoWidth);
          doc.text(captionLines, photoX, yPosition + photoHeight + 5);

          // Note: In a real implementation, you would fetch and embed the actual images
          // For now, we show placeholders with URLs
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          const urlLines = doc.splitTextToSize(photo.photo_url, photoWidth);
          doc.text(urlLines, photoX, yPosition + photoHeight + 12);

        } catch (error) {
          console.error("Error adding photo to PDF:", error);
        }

        photoX += photoWidth + 10;
      }

      yPosition += photoHeight + 20;
    }
  }

  // Summary
  checkPageBreak(40);
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const totalItems = inventoryItems.length;
  const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0);
  const totalPhotos = (photosData || []).length;

  doc.text(`Total Items: ${totalItems}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Quantity: ${totalQuantity}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Estimated Value: $${totalValue.toFixed(2)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Photos: ${totalPhotos}`, 20, yPosition);

  // Generate filename and save
  const fileName = `inventory-report-${property?.name?.replace(/[^a-zA-Z0-9]/g, "-") || "property"}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);

  return fileName;
};