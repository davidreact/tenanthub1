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
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { getConditionColor } from "@/utils/statusUtils";

interface InventoryGridViewProps {
  t: any;
  filteredItems: InventoryItem[];
  photos: InventoryPhoto[];
  onPhotoClick: (itemId: string) => void;
  onEditClick: (item: InventoryItem) => void;
}

/**
 * @description Renders a table view of inventory items with columns for item details, condition, notes, photos, and actions.
 */
export function InventoryGridView({
  t,
  filteredItems,
  photos,
  onPhotoClick,
  onEditClick,
}: InventoryGridViewProps) {

  const columnHelper = createColumnHelper<InventoryItem>();

  const columns: ColumnDef<InventoryItem, any>[] = [
    columnHelper.accessor('item', {
      header: t("common.item"),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('description', {
      header: t("common.description"),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('quantity', {
      header: t("common.quantity"),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('condition', {
      header: t("common.condition"),
      cell: info => (
        <Badge className={getConditionColor(info.getValue())}>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('notes', {
      header: t("common.notes"),
      cell: info => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditClick(info.row.original)}
        >
          <Edit className="h-4 w-4 mr-1" />
          {t("common.notes")}
        </Button>
      ),
    }),
    columnHelper.display({
      id: 'photos',
      header: t("common.photos"),
      cell: info => {
        const itemPhotos = photos.filter(
          (photo) => photo.inventory_item_id === info.row.original.id,
        );
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPhotoClick(info.row.original.id)}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            {itemPhotos.length}
          </Button>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: t("common.actions"),
      cell: info => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditClick(info.row.original)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="w-32">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
