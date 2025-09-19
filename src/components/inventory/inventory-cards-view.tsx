import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Edit } from "lucide-react";

interface InventoryItem {
  id: string;
  item: string;
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

interface InventoryCardsViewProps {
  t: any;
  filteredItems: InventoryItem[];
  photos: InventoryPhoto[];
  onPhotoClick: (itemId: string) => void;
  onEditClick: (item: InventoryItem) => void;
}

export function InventoryCardsView({
  t,
  filteredItems,
  photos,
  onPhotoClick,
  onEditClick,
}: InventoryCardsViewProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
                {item.properties.name} • {item.location}
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
                    />
                  ))}
                  {itemPhotos.length > 4 && (
                    <div
                      className="bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600 cursor-pointer"
                      onClick={() => onPhotoClick(item.id)}
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
