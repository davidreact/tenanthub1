import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  Edit,
  Users,
  FileText,
} from "lucide-react";
import { InventoryRole } from "@/types/inventory";

interface InventoryActionsProps {
  role: InventoryRole;
  onExportExcel: () => void;
  onImportExcel: (file: File) => void;
  onBulkEdit?: () => void;
  onAssignmentManage?: () => void;
  onGenerateReport?: () => void;
  importing?: boolean;
  t: any;
}

export function InventoryActions({
  role,
  onExportExcel,
  onImportExcel,
  onBulkEdit,
  onAssignmentManage,
  onGenerateReport,
  importing = false,
  t,
}: InventoryActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {role === 'admin' && onBulkEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          {t?.("common.bulkEdit") || "Bulk Edit"}
        </Button>
      )}

      {role === 'admin' && onAssignmentManage && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAssignmentManage}
        >
          <Users className="h-4 w-4 mr-2" />
          {t?.("inventory.assignToTenant") || "Assign to Tenant"}
        </Button>
      )}

      {onGenerateReport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateReport}
        >
          <FileText className="h-4 w-4 mr-2" />
          {t?.("common.printReport") || "Print Report"}
        </Button>
      )}

      <Button variant="outline" size="sm" onClick={onExportExcel}>
        <Download className="h-4 w-4 mr-2" />
        {t?.("common.exportExcel") || "Export Excel"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.xlsx,.xls';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) onImportExcel(file);
          };
          input.click();
        }}
        disabled={importing}
      >
        <Upload className="h-4 w-4 mr-2" />
        {importing ? t?.("common.importing") || "Importing..." : t?.("common.importExcel") || "Import Excel"}
      </Button>
    </div>
  );
}