import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface InventoryStatsProps {
  t: any;
  filteredItems: InventoryItem[];
}

export function InventoryStats({ t, filteredItems }: InventoryStatsProps) {
  const getTotalValue = () => {
    return filteredItems.reduce(
      (sum, item) => sum + (item.estimated_value || 0),
      0,
    );
  };

  const getTotalQuantity = () => {
    return filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filteredItems.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Total {t("common.quantity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getTotalQuantity()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("common.estimatedValue")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${getTotalValue().toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
