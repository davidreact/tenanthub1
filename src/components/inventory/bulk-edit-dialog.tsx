import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Info } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

// Using the same GridItem interface as the main component
interface GridItem {
  id?: string;
  item: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  notes?: string;
  property_id: string;
  photo_file?: File | null;
  isNew?: boolean;
  isEdited?: boolean;
}

interface BulkEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  gridItems: GridItem[];
  setGridItems: React.Dispatch<React.SetStateAction<GridItem[]>>;
  properties: Property[];
  selectedProperty: string;
  onSave: () => void;
}

// Simple debounce utility
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

export function BulkEditDialog({
  isOpen,
  onOpenChange,
  gridItems,
  setGridItems,
  properties,
  selectedProperty,
  onSave,
}: BulkEditDialogProps) {
  // Ultra-fast grid cell change handler using onBlur for instant performance
  const handleGridCellChange = useCallback(
    (index: number, field: keyof GridItem, value: any) => {
      setGridItems((prev: GridItem[]) => {
        const newItems = [...prev];
        if (newItems[index]) {
          newItems[index] = {
            ...newItems[index],
            [field]: value,
            isEdited: !newItems[index].isNew,
          };
        }
        return newItems;
      });
    },
    []
  );

  // Immediate visual feedback handler for onChange (no state updates)
  const handleInputChange = useCallback(
    (index: number, field: keyof GridItem, value: string) => {
      // Store the value in a ref or temporary state for immediate visual feedback
      // This doesn't trigger expensive state updates
      const inputId = `${index}-${field}`;
      // We'll use a simple approach - just let the input handle its own state
    },
    []
  );

  const addNewGridRow = () => {
    const newItem: GridItem = {
      item: "",
      description: "",
      location: "",
      condition: "good",
      quantity: 1,
      estimated_value: 0,
      notes: "",
      property_id:
        selectedProperty !== "all" ? selectedProperty : properties[0]?.id || "",
      isNew: true,
      isEdited: false,
    };
    setGridItems((prev: GridItem[]) => [...prev, newItem]);
  };

  const removeGridRow = (index: number) => {
    setGridItems((prev: GridItem[]) => prev.filter((_, i) => i !== index));
  };

  const handlePasteFromExcel = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text");
    const rows = pastedData.split("\n").filter((row) => row.trim());

    if (rows.length === 0) return;

    const newItems: GridItem[] = [];

    rows.forEach((row, index) => {
      const columns = row.split("\t");

      if (columns.length >= 8) {
        // New format: Item ID, Item, Description, Location, Condition, Quantity, Value, Notes
        const itemId = columns[0]?.trim() || "";
        const isExistingItem = itemId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        const newItem: GridItem = {
          id: isExistingItem ? itemId : undefined,
          item: columns[1] || `Item ${index + 1}`,
          description: columns[2] || "",
          location: columns[3] || "",
          condition: ["excellent", "good", "fair", "poor"].includes(
            columns[4]?.toLowerCase(),
          )
            ? columns[4].toLowerCase()
            : "good",
          quantity: parseInt(columns[5]) || 1,
          estimated_value: parseFloat(columns[6]) || 0,
          notes: columns[7] || "",
          property_id:
            selectedProperty !== "all"
              ? selectedProperty
              : properties[0]?.id || "",
          isNew: !isExistingItem,
          isEdited: !!isExistingItem,
        };
        newItems.push(newItem);
      } else if (columns.length >= 7) {
        // Old format: Item, Description, Location, Condition, Quantity, Value, Notes
        // (without Item ID column)
        const newItem: GridItem = {
          item: columns[0] || `Item ${index + 1}`,
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
          isNew: true,
          isEdited: false,
        };
        newItems.push(newItem);
      }
    });

    setGridItems((prev) => [...prev, ...newItems]);
  };

  // Memoize table rows to prevent unnecessary re-renders
  const memoizedTableRows = useMemo(() => {
    return gridItems.map((item, index) => (
      <TableRow
        key={index}
        className={`
          transition-colors duration-150
          ${item.isNew
            ? "bg-emerald-100 dark:bg-emerald-900/30"
            : item.isEdited
              ? "bg-amber-100 dark:bg-amber-600/40"
              : ""
          }
          hover:bg-gray-100/80 dark:hover:bg-gray-700/40
        `}
      >
        <TableCell className="px-0.5 py-0.5">
          <Input
            defaultValue={item.item}
            onBlur={(e) =>
              handleGridCellChange(
                index,
                "item",
                e.target.value,
              )
            }
            className="w-full h-7 text-xs p-1 pt-1 pb-1"
          />
        </TableCell>
        <TableCell className="px-0.5 py-0.5">
          <Input
            defaultValue={item.description}
            onBlur={(e) =>
              handleGridCellChange(
                index,
                "description",
                e.target.value,
              )
            }
            className="w-full h-7 text-xs p-1 py-0"
          />
        </TableCell>
        <TableCell className="px-0.5 py-0.5">
          <Input
            defaultValue={item.location}
            onBlur={(e) =>
              handleGridCellChange(
                index,
                "location",
                e.target.value,
              )
            }
            className="w-full h-7 text-xs p-1 py-0"
          />
        </TableCell>
        <TableCell className="px-0.5 py-0.5">
          <Select
            defaultValue={item.property_id}
            onValueChange={(value) =>
              handleGridCellChange(index, "property_id", value)
            }
          >
            <SelectTrigger className="w-full h-7 bg-background border-input hover:bg-accent hover:text-accent-foreground text-xs p-1 pt-1 pb-1">
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
        <TableCell className="px-0.5 py-0.5">
          <Select
            defaultValue={item.condition}
            onValueChange={(value) =>
              handleGridCellChange(index, "condition", value)
            }
          >
            <SelectTrigger className="w-full h-7 bg-background border-input hover:bg-accent hover:text-accent-foreground text-xs p-1 py-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="px-0.5 py-0.5">
          <Input
            type="number"
            defaultValue={item.quantity}
            onBlur={(e) =>
              handleGridCellChange(
                index,
                "quantity",
                parseInt(e.target.value) || 0,
              )
            }
            className="w-full h-7 text-xs"
          />
        </TableCell>
        <TableCell className="px-0.5 py-0.5">
          <Input
            type="number"
            step="0.01"
            defaultValue={item.estimated_value}
            onBlur={(e) =>
              handleGridCellChange(
                index,
                "estimated_value",
                parseFloat(e.target.value) || 0,
              )
            }
            className="w-full h-7 text-xs"
          />
        </TableCell>
        <TableCell className="px-0.5 py-0.5">
          <Input
            defaultValue={item.notes}
            onBlur={(e) =>
              handleGridCellChange(
                index,
                "notes",
                e.target.value,
              )
            }
            className="w-full h-7 text-xs"
          />
        </TableCell>
        <TableCell className="px-0.5 py-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeGridRow(index)}
            className="bg-background hover:bg-destructive hover:text-destructive-foreground border border-border h-7 w-7 p-0"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </TableCell>
      </TableRow>
    ));
  }, [gridItems, handleGridCellChange, properties, removeGridRow]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bulk Inventory Editor</DialogTitle>
          <DialogDescription>
            Edit multiple items at once. Paste from Excel (Ctrl+V) or add rows
            manually. Expected columns: Item ID, Item, Description, Location, Condition,
            Quantity, Value, Notes
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {/* Color Scheme Info Message */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-blue-900 dark:text-blue-100">Color Guide:</span>
                <span className="text-blue-700 dark:text-blue-300">
                  🟢 <strong className="text-emerald-600 dark:text-emerald-400">Emerald</strong> = New items
                </span>
                <span className="text-blue-700 dark:text-blue-300">
                  🟡 <strong className="text-amber-600 dark:text-amber-400">Amber</strong> = Edited items
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <Button onClick={addNewGridRow} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            <Button onClick={onSave} size="sm">
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
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-32">ITEM</TableHead>
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-40">Description</TableHead>
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-24">Location</TableHead>
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-32">Property</TableHead>
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-24">Condition</TableHead>
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-20">Qty</TableHead>
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-24">Value</TableHead>
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-32">Notes</TableHead>
                  <TableHead className="px-0.5 py-1 text-xs font-semibold w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memoizedTableRows}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Tip:</strong> Copy data from Excel and paste here (Ctrl+V).
            </p>
            <p>
              <strong>Tip:</strong> Changes are saved to the database when you click "Save Changes".
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
