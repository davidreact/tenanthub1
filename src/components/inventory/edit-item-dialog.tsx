import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  property_id: string;
  notes?: string;
  created_at?: string;
  properties: {
    name: string;
    address: string;
  };
}

interface InventoryPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  inventory_item_id: string;
}

interface EditItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: InventoryItem | null;
  photos: InventoryPhoto[];
  t: any;
  onSave: (itemData: Partial<InventoryItem>) => void;
  onUploadPhotos: (files: FileList | null) => void;
  onDeletePhoto: (photoId: string) => void;
  uploadingPhotos: boolean;
}

export function EditItemDialog({
  isOpen,
  onOpenChange,
  selectedItem,
  photos,
  t,
  onSave,
  onUploadPhotos,
  onDeletePhoto,
  uploadingPhotos,
}: EditItemDialogProps) {
  if (!selectedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update item information and manage photos
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const itemData = {
              name: formData.get("name") as string,
              description: formData.get("description") as string,
              location: formData.get("location") as string,
              condition: formData.get("condition") as string,
              quantity: parseInt(formData.get("quantity") as string) || 1,
              estimated_value:
                parseFloat(formData.get("estimated_value") as string) || 0,
              notes: formData.get("notes") as string,
            };

            onSave(itemData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">{t("common.name")}</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={selectedItem.name}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-location">{t("common.location")}</Label>
              <Input
                id="edit-location"
                name="location"
                defaultValue={selectedItem.location}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">{t("common.description")}</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={selectedItem.description}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-condition">{t("common.condition")}</Label>
              <Select
                name="condition"
                defaultValue={selectedItem.condition}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-quantity">{t("common.quantity")}</Label>
              <Input
                id="edit-quantity"
                name="quantity"
                type="number"
                min="1"
                defaultValue={selectedItem.quantity}
              />
            </div>
            <div>
              <Label htmlFor="edit-estimated_value">
                {t("common.estimatedValue")}
              </Label>
              <Input
                id="edit-estimated_value"
                name="estimated_value"
                type="number"
                step="0.01"
                min="0"
                defaultValue={selectedItem.estimated_value}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-notes">{t("common.notes")}</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              defaultValue={selectedItem.notes}
              rows={2}
            />
          </div>

          {/* Photo Management Section */}
          <div className="space-y-4">
            <div>
              <Label>Upload New Photos</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onUploadPhotos(e.target.files)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Current Photos</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {photos
                  .filter((photo) => photo.inventory_item_id === selectedItem.id)
                  .map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || "Inventory photo"}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeletePhoto(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {photo.caption && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={uploadingPhotos}
          >
            {uploadingPhotos ? "Uploading Photos..." : t("common.saveChanges")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
