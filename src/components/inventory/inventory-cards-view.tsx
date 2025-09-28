import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Edit } from "lucide-react";
import { InventoryItem, InventoryPhoto } from "@/types/inventory";
import { getConditionColor } from "@/utils/statusUtils";

interface InventoryCardsViewProps {
  t: any;
  filteredItems: InventoryItem[];
  photos: InventoryPhoto[];
  onPhotoClick: (itemId: string) => void;
  onEditClick: (item: InventoryItem) => void;
}

/**
 * @description Renders inventory items in a card-based grid layout with photos, details, and action buttons.
 */
export function InventoryCardsView({
  t,
  filteredItems,
  photos,
  onPhotoClick,
  onEditClick,
}: InventoryCardsViewProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredItems.map((item) => {
        const itemPhotos = photos.filter(
          (photo) => photo.inventory_item_id === item.id,
        );
        return (
          <Card
            key={item.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.item}</CardTitle>
                <Badge className={getConditionColor(item.condition)}>
                  {item.condition}
                </Badge>
              </div>
              <CardDescription>
                {item.properties?.name || 'Unknown Property'} • {item.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {itemPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {itemPhotos.slice(0, 4).map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.photo_url}
                      alt={photo.caption || item.item}
                      className="w-full h-20 object-cover rounded cursor-pointer"
                      onClick={() => onPhotoClick(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onPhotoClick(item.id);
                        }
                      }}
                    />
                  ))}
                  {itemPhotos.length > 4 && (
                    <div
                      className="bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600 cursor-pointer"
                      onClick={() => onPhotoClick(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onPhotoClick(item.id);
                        }
                      }}
                      aria-label={`View ${itemPhotos.length - 4} more photos`}
                    >
                      +{itemPhotos.length - 4} more
                    </div>
                  )}
                </div>
              )}

              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t("common.quantity")}:</span>
                  <p className="font-medium">{item.quantity}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t("common.value")}:</span>
                  <p className="font-medium">${item.estimated_value || 0}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onPhotoClick(item.id)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photos ({itemPhotos.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditClick(item)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
