import { Button } from "@/components/ui/button";
import { CheckSquare, Square } from "lucide-react";

interface InventoryBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  t: any;
}

export function InventoryBulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  t,
}: InventoryBulkActionsProps) {
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectAll(true)}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          {t?.("common.selectAll") || "Select All"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectAll(false)}
        >
          <Square className="h-4 w-4 mr-2" />
          {t?.("common.deselectAll") || "Deselect All"}
        </Button>
        {selectedCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedCount} of {totalCount} selected
          </span>
        )}
      </div>
    </div>
  );
}