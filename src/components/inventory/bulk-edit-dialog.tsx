import { useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface GridItem {
  id?: string;
  item: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  notes: string;
  property_id: string;
  photo_references?: string;
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

export function BulkEditDialog({
  isOpen,
  onOpenChange,
  gridItems,
  setGridItems,
  properties,
  selectedProperty,
  onSave,
}: BulkEditDialogProps) {
  const handleGridCellChange = (
    index: number,
    field: keyof GridItem,
    value: any,
  ) => {
    setGridItems((prev: GridItem[]) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [field]: value,
            isEdited: !item.isNew,
          };
        }
        return item;
      }),
    );
  };

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
      photo_references: "",
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
      if (columns.length >= 6) {
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
          photo_references: columns[7] || "",
          isNew: true,
          isEdited: false,
        };
        newItems.push(newItem);
      }
    });

    setGridItems((prev) => [...prev, ...newItems]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bulk Inventory Editor</DialogTitle>
          <DialogDescription>
            Edit multiple items at once. Paste from Excel (Ctrl+V) or add rows
            manually. Expected columns: Name, Description, Location, Condition,
            Quantity, Value, Notes, Photo References
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
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
                  <TableHead className="w-32">ITEM</TableHead>
                  <TableHead className="w-40">Description</TableHead>
                  <TableHead className="w-24">Location</TableHead>
                  <TableHead className="w-32">Property</TableHead>
                  <TableHead className="w-24">Condition</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-24">Value</TableHead>
                  <TableHead className="w-32">Notes</TableHead>
                  <TableHead className="w-32">Photo</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gridItems.map((item, index) => (
                  <TableRow
                    key={index}
                    className={
                      item.isNew
                        ? "bg-green-50"
                        : item.isEdited
                          ? "bg-yellow-50"
                          : ""
                    }
                  >
                    <TableCell>
                      <Input
                        value={item.item}
                        onChange={(e) =>
                          handleGridCellChange(
                            index,
                            "item",
                            e.target.value,
                          )
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          handleGridCellChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.location}
                        onChange={(e) =>
                          handleGridCellChange(
                            index,
                            "location",
                            e.target.value,
                          )
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.property_id}
                        onValueChange={(value) =>
                          handleGridCellChange(index, "property_id", value)
                        }
                      >
                        <SelectTrigger className="w-full">
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
                    <TableCell>
                      <Select
                        value={item.condition}
                        onValueChange={(value) =>
                          handleGridCellChange(index, "condition", value)
                        }
                      >
                        <SelectTrigger className="w-full">
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
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleGridCellChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.estimated_value}
                        onChange={(e) =>
                          handleGridCellChange(
                            index,
                            "estimated_value",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.notes}
                        onChange={(e) =>
                          handleGridCellChange(
                            index,
                            "notes",
                            e.target.value,
                          )
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handleGridCellChange(index, "photo_file", file);
                          }}
                          className="w-full text-xs"
                        />
                        {item.photo_file && (
                          <span className="text-xs text-green-600 whitespace-nowrap">
                            ✓
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGridRow(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Tip:</strong> Copy data from Excel and paste here (Ctrl+V).
              Green rows are new, yellow rows are edited.
            </p>
            <p>
              <strong>Photos:</strong> Upload photos directly in the Photo
              column. They will be saved when you save changes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
