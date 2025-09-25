"use client";

import { useState, useRef } from "react";
import { createClient } from "../../../supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { FileUploadRestrictions } from "@/components/FileUploadRestrictions";

interface PhotoCaptureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCaptured: (files: FileList | null) => void;
  title?: string;
  description?: string;
}

interface CapturedPhoto {
  file: File;
  preview: string;
  caption: string;
}

export function PhotoCaptureDialog({
  isOpen,
  onOpenChange,
  onPhotoCaptured,
  title = "Add Photos",
  description = "Take photos or upload images for this inventory item",
}: PhotoCaptureDialogProps) {
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          setCapturedPhotos(prev => [...prev, {
            file,
            preview,
            caption: ""
          }]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          setCapturedPhotos(prev => [...prev, {
            file,
            preview,
            caption: ""
          }]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    setCapturedPhotos(prev => prev.map((photo, i) =>
      i === index ? { ...photo, caption } : photo
    ));
  };

  const handleSave = () => {
    if (capturedPhotos.length === 0) {
      toast({
        title: "No Photos",
        description: "Please capture or upload at least one photo.",
        variant: "destructive",
      });
      return;
    }

    // Create a custom FileList-like object
    const dataTransfer = new DataTransfer();
    capturedPhotos.forEach((photo) => {
      // Create a new file with caption in the name if provided
      const fileName = photo.caption
        ? `${photo.caption.replace(/[^a-zA-Z0-9]/g, '_')}_${photo.file.name}`
        : photo.file.name;
      const captionedFile = new File([photo.file], fileName, { type: photo.file.type });
      dataTransfer.items.add(captionedFile);
    });

    onPhotoCaptured(dataTransfer.files);
    setCapturedPhotos([]);
    onOpenChange(false);

    toast({
      title: "Photos Added",
      description: `Successfully added ${capturedPhotos.length} photo(s).`,
    });
  };

  const handleCancel = () => {
    setCapturedPhotos([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Capture Controls */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Photos
            </Button>
          </div>

          <FileUploadRestrictions className="mb-4" />

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Captured Photos Grid */}
          {capturedPhotos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Captured Photos ({capturedPhotos.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {capturedPhotos.map((photo, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={photo.preview}
                        alt={`Captured photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`caption-${index}`} className="text-sm">
                        Caption (Optional)
                      </Label>
                      <Input
                        id={`caption-${index}`}
                        placeholder="Describe this photo..."
                        value={photo.caption}
                        onChange={(e) => updateCaption(index, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {capturedPhotos.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Yet</h3>
              <p className="text-gray-500 mb-4">
                Use the buttons above to take photos or upload images
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={capturedPhotos.length === 0}
            >
              Add {capturedPhotos.length} Photo{capturedPhotos.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
