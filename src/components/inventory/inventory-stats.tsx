import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryItem } from "@/types/inventory";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InventoryStatsProps {
  t: any;
  filteredItems: InventoryItem[];
  showChart?: boolean;
}

/**
 * @description Displays statistical overview cards for inventory items, including total count, quantity, and estimated value.
 */
export function InventoryStats({ t, filteredItems, showChart = true }: InventoryStatsProps) {
  const getTotalValue = () => {
    return filteredItems.reduce(
      (sum, item) => sum + (item.estimated_value || 0),
      0,
    );
  };

  const getTotalQuantity = () => {
    return filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const getConditionData = () => {
    const conditions = ['excellent', 'good', 'fair', 'poor'];
    return conditions.map(condition => ({
      condition: condition.charAt(0).toUpperCase() + condition.slice(1),
      count: filteredItems.filter(item => item.condition === condition).length,
    }));
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

      {/* Condition Distribution Chart */}
      {showChart && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Item Condition Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getConditionData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="condition" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
