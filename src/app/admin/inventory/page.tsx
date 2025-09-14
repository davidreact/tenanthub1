"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Package, Building, Search } from "lucide-react";
import Link from "next/link";

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  location: string;
  condition: string;
  quantity: number;
  estimated_value: number;
  property_id: string;
  properties: {
    name: string;
    address: string;
  };
}

export default function AdminInventory() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [inventoryItems, selectedProperty, searchTerm]);

  const fetchData = async () => {
    try {
      // Fetch properties
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("*")
        .order("name");

      // Fetch all inventory items with property info
      const { data: inventoryData } = await supabase
        .from("inventory_items")
        .select(
          `
          *,
          properties (name, address)
        `,
        )
        .order("created_at", { ascending: false });

      setProperties(propertiesData || []);
      setInventoryItems(inventoryData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = inventoryItems;

    // Filter by property
    if (selectedProperty !== "all") {
      filtered = filtered.filter(
        (item) => item.property_id === selectedProperty,
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredItems(filtered);
  };

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

  const getTotalValue = () => {
    return filteredItems.reduce(
      (sum, item) => sum + (item.estimated_value || 0),
      0,
    );
  };

  const getTotalQuantity = () => {
    return filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToDashboard")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8" />
              {t("inventory.inventoryManagement")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("inventory.managePropertyInventories")}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("common.filter")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("common.property")}
                </label>
                <Select
                  value={selectedProperty}
                  onValueChange={setSelectedProperty}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All {t("common.property")}
                    </SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("common.search")} Items
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={`${t("common.search")} by ${t("common.name")}, ${t("common.description")}, or ${t("common.location")}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
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
              <div className="text-2xl font-bold">
                ${getTotalValue().toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {properties.map((property) => {
            const propertyItems = inventoryItems.filter(
              (item) => item.property_id === property.id,
            );
            const propertyValue = propertyItems.reduce(
              (sum, item) => sum + (item.estimated_value || 0),
              0,
            );

            return (
              <Card
                key={property.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {property.name}
                  </CardTitle>
                  <CardDescription>{property.address}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Items:</span>
                      <p className="font-medium">{propertyItems.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {t("common.value")}:
                      </span>
                      <p className="font-medium">${propertyValue.toFixed(2)}</p>
                    </div>
                  </div>

                  <Link href={`/admin/properties/${property.id}/inventory`}>
                    <Button className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      {t("inventory.inventoryManagement")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Inventory Items */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedProperty === "all"
              ? `All ${t("inventory.inventory")} Items`
              : "Filtered Items"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge className={getConditionColor(item.condition)}>
                      {item.condition}
                    </Badge>
                  </div>
                  <CardDescription>
                    {item.properties.name} • {item.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">
                        {t("common.quantity")}:
                      </span>
                      <p className="font-medium">{item.quantity}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {t("common.value")}:
                      </span>
                      <p className="font-medium">
                        ${item.estimated_value || 0}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/properties/${item.property_id}/inventory`}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      View in {t("common.property")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No {t("inventory.inventory")} Items
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedProperty !== "all"
                  ? "No items match your current filters."
                  : `No ${t("inventory.inventory")} items have been added yet.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
