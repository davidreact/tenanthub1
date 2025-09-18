import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Grid, Download, Upload, Edit } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface InventoryFiltersProps {
  t: any;
  selectedProperty: string;
  setSelectedProperty: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  viewMode: "cards" | "grid";
  setViewMode: (mode: "cards" | "grid") => void;
  properties: Property[];
  onBulkEdit: () => void;
  onExportExcel: () => void;
  onImportExcel: () => void;
  importingCSV: boolean;
}

export function InventoryFilters({
  t,
  selectedProperty,
  setSelectedProperty,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  properties,
  onBulkEdit,
  onExportExcel,
  onImportExcel,
  importingCSV,
}: InventoryFiltersProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t("common.filter")}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <Search className="h-4 w-4 mr-2" />
              Cards
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button variant="outline" size="sm" onClick={onBulkEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Bulk Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onImportExcel}
              disabled={importingCSV}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importingCSV ? "Importing..." : "Import Excel"}
            </Button>
          </div>
        </div>
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
                <SelectItem value="all">All {t("common.property")}</SelectItem>
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
  );
}
