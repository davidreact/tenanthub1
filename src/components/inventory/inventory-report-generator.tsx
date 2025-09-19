import { createClient } from "../../../supabase/client";

interface InventoryItem {
  id: string;
  item: string;
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
  }>;
}

interface TenantProperty {
  id: string;
  lease_start_date: string;
  lease_end_date: string;
  properties: Array<{
    name: string;
    address: string;
  }> | {
    name: string;
    address: string;
  } | null;
}

interface UserData {
  full_name: string;
  email: string;
}

type ItemsByLocation = Record<string, InventoryItem[]>;

interface PhotoEntry {
  index: number; // 1-based index
  label: string; // e.g., P001
  photo_url: string;
  caption?: string;
  itemName: string;
  itemId: string;
}

export class InventoryReportGenerator {
  private supabase = createClient();

  async generateReport(inventoryItems: InventoryItem[]): Promise<string> {
    try {
      // Get tenant and property information
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const [userData, tenantProperty] = await Promise.all([
        this.getUserData(user.id),
        this.getTenantProperty(user.id)
      ]);

      if (!userData || !tenantProperty) {
        throw new Error("Unable to retrieve user or property information");
      }

      // Group items by location for better organization
      const itemsByLocation = this.groupItemsByLocation(inventoryItems);

      // Build photo index and per-item references
      const { flatPhotos, photoRefsByItem } = this.buildPhotoIndex(itemsByLocation);

      // Generate the professional HTML report
      return this.createReportHTML(userData, tenantProperty, itemsByLocation, photoRefsByItem, flatPhotos);
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  }

  private async getUserData(userId: string): Promise<UserData | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user data:", error);
      return null;
    }

    return data;
  }

  private async getTenantProperty(userId: string): Promise<TenantProperty | null> {
    const { data, error } = await this.supabase
      .from("tenant_properties")
      .select(`
        id,
        lease_start_date,
        lease_end_date,
        properties (
          name,
          address
        )
      `)
      .eq("tenant_id", userId)
      .eq("status", "active")
      .single();

    if (error) {
      console.error("Error fetching tenant property:", error);
      return null;
    }

    return data as unknown as TenantProperty;
  }

  private groupItemsByLocation(items: InventoryItem[]): ItemsByLocation {
    return items.reduce((acc, item) => {
      const location = item.location || "Unspecified Location";
      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(item);
      return acc;
    }, {} as ItemsByLocation);
  }

  private padPhotoIndex(n: number): string {
    // P001, P002 ... P999
    if (n < 10) return `P00${n}`;
    if (n < 100) return `P0${n}`;
    return `P${n}`;
  }

  private buildPhotoIndex(itemsByLocation: ItemsByLocation): { flatPhotos: PhotoEntry[]; photoRefsByItem: Record<string, string> } {
    const flatPhotos: PhotoEntry[] = [];
    const photoRefsByItem: Record<string, string> = {};
    let globalIndex = 0;

    // Iterate locations, then items, preserving order for stable references
    Object.values(itemsByLocation).forEach(items => {
      items.forEach(item => {
        const photos = item.inventory_photos || [];
        if (photos.length === 0) return;

        const startIndex = globalIndex + 1;
        photos.forEach(p => {
          globalIndex += 1;
          const label = this.padPhotoIndex(globalIndex);
          flatPhotos.push({
            index: globalIndex,
            label,
            photo_url: p.photo_url,
            caption: p.caption,
            itemName: item.item,
            itemId: item.id
          });
        });
        const endIndex = globalIndex;
        // Build compact reference: "P001" or "P001–P006"
        photoRefsByItem[item.id] = startIndex === endIndex
          ? this.padPhotoIndex(startIndex)
          : `${this.padPhotoIndex(startIndex)}–${this.padPhotoIndex(endIndex)}`;
      });
    });

    return { flatPhotos, photoRefsByItem };
  }

  private createReportHTML(
    userData: UserData,
    tenantProperty: TenantProperty,
    itemsByLocation: ItemsByLocation,
    photoRefsByItem: Record<string, string>,
    flatPhotos: PhotoEntry[]
  ): string {
    const totalItems = Object.values(itemsByLocation).flat().length;
    const totalValue = Object.values(itemsByLocation)
      .flat()
      .reduce((sum, item) => sum + (item.estimated_value || 0), 0);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inventory Report - ${userData.full_name}</title>
        <style>
          ${this.getReportStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          ${this.createReportHeader(userData, tenantProperty, totalItems, totalValue)}
          ${this.createReportContent(itemsByLocation, photoRefsByItem)}
          ${this.createPhotosAppendix(flatPhotos)}
          ${this.createReportFooter()}
        </div>
      </body>
      </html>
    `;
  }

  private getReportStyles(): string {
    return `
      @media print {
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          line-height: 1.3;
          color: #1a1a1a;
          background: white;
          font-size: 10pt;
        }

        .report-container {
          max-width: none;
          margin: 0;
          padding: 0;
        }

        .header-section {
          border-bottom: 2px solid #000;
          padding: 12px 0;
          margin-bottom: 16px;
        }

        .header-title {
          font-size: 18pt;
          font-weight: bold;
          color: #000;
          margin: 0 0 12px 0;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
        }

        .header-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 12px;
          font-size: 9pt;
        }

        .header-section h3 {
          font-size: 10pt;
          font-weight: bold;
          color: #000;
          margin: 0 0 6px 0;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
        }

        .header-section p {
          margin: 3px 0;
          font-size: 9pt;
        }

        .header-section strong {
          color: #000;
          font-weight: bold;
        }

        .summary-stats {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 6px 0;
          margin: 8px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 12pt;
          font-weight: bold;
          color: #000;
          display: block;
        }

        .stat-label {
          font-size: 7pt;
          color: #000;
          text-transform: uppercase;
          font-weight: normal;
        }

        .location-section {
          margin-bottom: 18px;
          page-break-inside: avoid;
        }

        .location-header {
          background: #000;
          color: white;
          padding: 6px 10px;
          margin: 12px 0 8px 0;
          font-size: 11pt;
        }

        .location-header h2 {
          font-size: 10pt;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
        }

        .location-count {
          font-size: 8pt;
          opacity: 1;
          font-weight: normal;
        }

        .item-card {
          border: 1px solid #000;
          padding: 8px;
          margin: 6px 0;
          page-break-inside: avoid;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          gap: 10px;
        }

        .item-title {
          font-size: 11pt;
          font-weight: bold;
          color: #000;
          margin: 0;
          flex: 1;
          text-transform: uppercase;
        }

        .condition-badge {
          padding: 2px 6px;
          border: 1px solid #000;
          font-size: 7pt;
          font-weight: normal;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .condition-excellent { border-width: 2px; }
        .condition-good { border-style: solid; }
        .condition-fair { border-style: dashed; }
        .condition-poor { border-style: dotted; }

        .item-description {
          font-size: 8pt;
          color: #000;
          margin: 4px 0;
          font-style: italic;
          padding-left: 8px;
          border-left: 1px solid #000;
        }

        .item-details {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin: 6px 0;
        }

        .detail-item {
          padding: 4px 6px;
          border-left: 2px solid #000;
        }

        .detail-label {
          font-size: 8pt;
          font-weight: bold;
          color: #000;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .detail-value {
          font-size: 9pt;
          font-weight: normal;
          color: #000;
        }

        .notes-section {
          margin-top: 8px;
          border-top: 1px solid #000;
          padding-top: 6px;
        }

        .notes-container {
          display: grid;
          gap: 6px;
        }

        .notes-box {
          border-left: 2px solid #000;
          padding: 4px 6px;
        }

        .notes-label {
          font-size: 7pt;
          font-weight: bold;
          color: #000;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .notes-content {
          font-size: 8pt;
          line-height: 1.3;
          color: #000;
          font-style: italic;
        }

        .photo-ref {
          margin-top: 6px;
          font-size: 8pt;
          color: #000;
        }

        .photo-ref strong {
          font-weight: bold;
        }

        /* Appendix photo pages */
        .photos-appendix-title {
          page-break-before: always;
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          margin: 6px 0 8px 0;
          padding-bottom: 4px;
          border-bottom: 1px solid #000;
        }

        .photos-page {
          page-break-inside: avoid;
          padding: 0;
          margin: 0;
        }

        .photos-grid-large {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6pt;
          margin: 0;
          padding: 0;
        }

        .photo-cell {
          border: 1px solid #000;
          padding: 3pt;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }

        .photo-img {
          width: 100%;
          height: 3.3in; /* 3 rows on 10.4in printable height (letter - margins) */
          object-fit: contain;
          background: #fff;
          border: 1px solid #000;
        }

        .photo-caption {
          width: 100%;
          font-size: 8pt;
          color: #000;
          margin-top: 3pt;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .photo-meta {
          width: 100%;
          font-size: 7pt;
          color: #000;
          text-align: center;
        }

        @page {
          margin: 0.3in; /* minimize margins for better photo space usage */
          size: letter portrait;
        }

        .page-break {
          page-break-before: always;
        }

        .no-break {
          page-break-inside: avoid;
        }
      }

      @media screen {
        body {
          background: #f8fafc;
        }

        .report-container {
          max-width: 8.5in;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
      }
    `;
  }

  private createReportHeader(
    userData: UserData,
    tenantProperty: TenantProperty,
    totalItems: number,
    totalValue: number
  ): string {
    const propertyObj = Array.isArray(tenantProperty.properties)
      ? tenantProperty.properties?.[0]
      : (tenantProperty.properties as any);

    return `
      <div class="header-section">
        <h1 class="header-title">Inventory Report</h1>

        <div class="header-grid">
          <div>
            <h3>Tenant Information</h3>
            <p><strong>Name:</strong> ${userData.full_name}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
          </div>
          <div>
            <h3>Property Information</h3>
            <p><strong>Property:</strong> ${propertyObj?.name || 'N/A'}</p>
            <p><strong>Address:</strong> ${propertyObj?.address || 'N/A'}</p>
            <p><strong>Lease Period:</strong> ${new Date((tenantProperty as any).lease_start_date).toLocaleDateString()} - ${new Date((tenantProperty as any).lease_end_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">${totalItems}</span>
              <span class="stat-label">Total Items</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span class="stat-label">Total Value</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${Object.keys(this.groupItemsByLocation([])).length}</span>
              <span class="stat-label">Locations</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${new Date().toLocaleDateString()}</span>
              <span class="stat-label">Report Date</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private createReportContent(itemsByLocation: ItemsByLocation, photoRefsByItem: Record<string, string>): string {
    return Object.entries(itemsByLocation)
      .map(([location, items]) => `
        <div class="location-section">
          <div class="location-header">
            <h2>${location}</h2>
            <div class="location-count">${items.length} item${items.length !== 1 ? 's' : ''}</div>
          </div>

          ${items.map(item => this.createItemCard(item, photoRefsByItem[item.id])).join('')}
        </div>
      `)
      .join('');
  }

  private createItemCard(item: InventoryItem, photoRef?: string): string {
    return `
      <div class="item-card">
        <div class="item-header">
          <h3 class="item-title">${item.item}</h3>
          <div class="condition-badge condition-${item.condition.toLowerCase()}">
            ${item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
          </div>
        </div>

        ${item.description ? `<p class="item-description">${item.description}</p>` : ''}

        <div class="item-details">
          <div class="detail-item">
            <div class="detail-label">Quantity</div>
            <div class="detail-value">${item.quantity}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Estimated Value</div>
            <div class="detail-value">$${item.estimated_value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Assigned Date</div>
            <div class="detail-value">${item.assigned_date ? new Date(item.assigned_date).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Location</div>
            <div class="detail-value">${item.location || 'N/A'}</div>
          </div>
        </div>

        ${(item.notes || item.assignment_notes) ? `
          <div class="notes-section">
            <div class="notes-container">
              ${item.notes ? `
                <div class="notes-box">
                  <div class="notes-label">Admin Notes</div>
                  <div class="notes-content">${item.notes}</div>
                </div>
              ` : ''}
              ${item.assignment_notes ? `
                <div class="notes-box">
                  <div class="notes-label">Your Notes</div>
                  <div class="notes-content">${item.assignment_notes}</div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${photoRef ? `
          <div class="photo-ref">
            <strong>Photos:</strong> ${photoRef} (see appendix)
          </div>
        ` : ''}
      </div>
    `;
  }

  private createPhotosAppendix(flatPhotos: PhotoEntry[]): string {
    if (!flatPhotos.length) return "";

    // 6 photos per page (3 rows x 2 columns)
    const perPage = 6;
    const pages: string[] = [];
    const totalPages = Math.ceil(flatPhotos.length / perPage);

    for (let page = 0; page < totalPages; page++) {
      const slice = flatPhotos.slice(page * perPage, (page + 1) * perPage);

      const pageHtml = `
        <div class="photos-page">
          ${page === 0 ? `<div class="photos-appendix-title">Photos Appendix</div>` : ``}
          <div class="photos-grid-large">
            ${slice.map(p => `
              <div class="photo-cell">
                <img class="photo-img" src="${p.photo_url}" alt="${(p.caption || p.itemName).replace(/"/g, '"')}" />
                <div class="photo-caption">${p.label} — ${p.itemName}${p.caption ? ` — ${p.caption}` : ""}</div>
                <div class="photo-meta"></div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      pages.push(pageHtml);
    }

    return pages.join("");
  }

  private createReportFooter(): string {
    return `
      <div class="footer" style="margin-top: 18px; padding-top: 8px; border-top: 1px solid #000; text-align: center; font-size: 8pt; color: #000;">
        <p><strong>TenantHub Inventory Report</strong></p>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Please keep this document for your records and reference during your tenancy.</p>
      </div>
    `;
  }

  async printReport(inventoryItems: InventoryItem[]): Promise<void> {
    try {
      const reportHTML = await this.generateReport(inventoryItems);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check your popup blocker.');
      }

      printWindow.document.write(reportHTML);
      printWindow.document.close();

      // Wait for images to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      };
    } catch (error) {
      console.error('Error printing report:', error);
      throw error;
    }
  }
}

// React Hook for easy usage in components
export function useInventoryReport() {
  const reportGenerator = new InventoryReportGenerator();

  const generateReport = async (inventoryItems: InventoryItem[]) => {
    return await reportGenerator.generateReport(inventoryItems);
  };

  const printReport = async (inventoryItems: InventoryItem[]) => {
    return await reportGenerator.printReport(inventoryItems);
  };

  return {
    generateReport,
    printReport
  };
}
