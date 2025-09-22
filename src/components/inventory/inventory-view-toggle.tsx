import { Button } from "@/components/ui/button";
import { Package, Grid } from "lucide-react";
import { InventoryViewMode } from "@/types/inventory";

interface InventoryViewToggleProps {
  viewMode: InventoryViewMode;
  onViewModeChange: (mode: InventoryViewMode) => void;
  t: any;
}

export function InventoryViewToggle({ viewMode, onViewModeChange, t }: InventoryViewToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === "cards" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("cards")}
      >
        <Package className="h-4 w-4 mr-2" />
        {t?.("inventory.cardsView") || "Cards"}
      </Button>
      <Button
        variant={viewMode === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
      >
        <Grid className="h-4 w-4 mr-2" />
        {t?.("inventory.gridView") || "Grid"}
      </Button>
    </div>
  );
}