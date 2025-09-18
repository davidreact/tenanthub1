import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2 } from "lucide-react";

interface InventoryPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  inventory_item_id: string;
}

interface PhotoManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId: string | null;
  photos: InventoryPhoto[];
  onUploadPhotos: (files: FileList | null) => void;
  onDeletePhoto: (photoId: string) => void;
  uploadingPhotos: boolean;
}

export function PhotoManagementDialog({
  isOpen,
  onOpenChange,
  selectedItemId,
  photos,
  onUploadPhotos,
  onDeletePhoto,
  uploadingPhotos,
}: PhotoManagementDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Photos</DialogTitle>
          <DialogDescription>
            Upload new photos or view existing ones for this inventory item.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Upload New Photos</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => onUploadPhotos(e.target.files)}
                className="flex-1"
              />
              <Button
                onClick={handleBrowseClick}
                disabled={uploadingPhotos}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingPhotos ? "Uploading..." : "Browse"}
              </Button>
            </div>
          </div>

          {selectedItemId && (
            <div>
              <Label>Existing Photos</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {photos
                  .filter((photo) => photo.inventory_item_id === selectedItemId)
                  .map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || "Inventory photo"}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <Button
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
