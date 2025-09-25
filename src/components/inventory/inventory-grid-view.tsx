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
import { InventoryItem, InventoryPhoto } from "@/types/inventory";

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
                <TableHead className="w-32">{t("common.item")}</TableHead>
                <TableHead className="w-40">{t("common.description")}</TableHead>
                <TableHead className="w-20">{t("common.quantity")}</TableHead>
                <TableHead className="w-24">{t("common.condition")}</TableHead>
                <TableHead className="w-24">{t("common.notes")}</TableHead>
                <TableHead className="w-24">{t("common.photos")}</TableHead>
                <TableHead className="w-20">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const itemPhotos = photos.filter(
                  (photo) => photo.inventory_item_id === item.id,
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Badge className={getConditionColor(item.condition)}>
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(item)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t("common.notes")}
                      </Button>
                    </TableCell>
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
