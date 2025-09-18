import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Image as ImageIcon, Edit } from "lucide-react";

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

interface InventoryGridViewProps {
  t: any;
  filteredItems: InventoryItem[];
  photos: InventoryPhoto[];
  onPhotoClick: (itemId: string) => void;
  onEditClick: (item: InventoryItem) => void;
}

export function InventoryGridView({
  t,
  filteredItems,
  photos,
  onPhotoClick,
  onEditClick,
}: InventoryGridViewProps) {
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
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Name</TableHead>
                <TableHead className="w-40">Description</TableHead>
                <TableHead className="w-24">Location</TableHead>
                <TableHead className="w-32">Property</TableHead>
                <TableHead className="w-24">Condition</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-24">Value</TableHead>
                <TableHead className="w-32">Notes</TableHead>
                <TableHead className="w-32">Photos</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const itemPhotos = photos.filter(
                  (photo) => photo.inventory_item_id === item.id,
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.properties.name}</TableCell>
                    <TableCell>
                      <Badge className={getConditionColor(item.condition)}>
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.estimated_value || 0}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPhotoClick(item.id)}
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        {itemPhotos.length}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
