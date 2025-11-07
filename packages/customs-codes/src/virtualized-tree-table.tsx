"use client";

import { useEffect, useRef } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import type { CustomsTreeNode } from "./types";

type VirtualizedTreeTableProps = {
  columns: ColumnDef<CustomsTreeNode, unknown>[];
  data: CustomsTreeNode[];
  loading: boolean;
  autoExpandAll?: boolean;
};

const GRID_TEMPLATE =
  "minmax(180px,1fr) minmax(600px,1.6fr) 50px 50px 50px 50px 50px 50px 120px";
const MIN_ROW_HEIGHT = 56;
const SKELETON_ROW_COUNT = 8;
const SKELETON_SECONDARY_WIDTHS = [
  "h-4 w-64",
  "h-4 w-10",
  "h-4 w-12",
  "h-4 w-12",
  "h-4 w-16",
  "h-4 w-14",
  "h-4 w-12",
  "h-4 w-20",
];

function computeMinTableWidth(template: string): number {
  const staticColumnsWidth = Array.from(template.matchAll(/(\d+)px/g))
    .map((match) => Number(match[1] ?? 0))
    .reduce((total, width) => total + width, 0);
  return 170 + staticColumnsWidth;
}

const MIN_TABLE_WIDTH = computeMinTableWidth(GRID_TEMPLATE);
type CustomsRateField = keyof Pick<
  CustomsTreeNode,
  "percentage" | "cefta" | "msa" | "trmtl" | "tvsh" | "excise"
>;
const RATE_FIELDS: CustomsRateField[] = [
  "percentage",
  "cefta",
  "msa",
  "trmtl",
  "tvsh",
  "excise",
];

function hasNoTaxes(node: CustomsTreeNode): boolean {
  return RATE_FIELDS.every((field) => {
    const value = node[field];
    return (Number.isFinite(value) ? value : 0) === 0;
  });
}

export function VirtualizedTreeTable({
  columns,
  data,
  loading,
  autoExpandAll = true,
}: VirtualizedTreeTableProps) {
  const table = useReactTable<CustomsTreeNode>({
    data,
    columns,
    getRowId: (row) => String(row.code),
    getSubRows: (row) => row.subRows ?? [],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  useEffect(() => {
    if (autoExpandAll) table.toggleAllRowsExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, autoExpandAll]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rows = table.getRowModel().rows;
  const rowCount = loading ? SKELETON_ROW_COUNT : rows.length;

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => MIN_ROW_HEIGHT,
    overscan: 12,
    getItemKey: (index) => rows[index]?.id ?? index,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: MIN_TABLE_WIDTH }}>
        <div
          className="sticky top-0 z-10 grid gap-4 border-b bg-muted/60 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => (
              <div key={header.id} className="min-w-0 items-center flex">
                {header.isPlaceholder
                  ? null
                  : flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
              </div>
            )),
          )}
        </div>
        <div
          ref={parentRef}
          className="relative"
          style={{
            maxHeight: "calc(100vh - 220px)",
            overflowY: "auto",
            scrollbarGutter: "stable both-edges",
          }}
        >
          <div style={{ height: totalSize, position: "relative" }}>
            {virtualItems.map((virtualItem) => {
              if (loading) {
                return (
                  <div
                    key={`skeleton-${virtualItem.index}`}
                    data-index={virtualItem.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute inset-x-0 grid items-center gap-4 border-b px-4 py-3 text-sm"
                    style={{
                      gridTemplateColumns: GRID_TEMPLATE,
                      transform: `translateY(${virtualItem.start}px)`,
                      height: virtualItem.size,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    {SKELETON_SECONDARY_WIDTHS.map((className, index) => (
                      <Skeleton key={index} className={className} />
                    ))}
                  </div>
                );
              }

              const row = rows[virtualItem.index];
              if (!row) return null;
              const isLeafRow = !row.getCanExpand();
              const rowHasNoTaxes = isLeafRow && hasNoTaxes(row.original);
              return (
                <div
                  key={row.id}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className={cn(
                    "absolute inset-x-0 grid gap-4 border-b px-4 py-3 text-sm transition-colors",
                    rowHasNoTaxes
                      ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-400/20 dark:hover:bg-emerald-400/30"
                      : "hover:bg-muted/40",
                  )}
                  style={{
                    gridTemplateColumns: GRID_TEMPLATE,
                    transform: `translateY(${virtualItem.start}px)`,
                    height: virtualItem.size,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className="min-w-0">
                      {flexRender(cell.column.columnDef.cell, {
                        ...cell.getContext(),
                        row,
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
