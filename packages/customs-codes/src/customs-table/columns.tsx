"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@workspace/ui/components/button";
import { formatDate, formatPercent } from "@workspace/customs-data/formatters";
import type { CustomsTreeNode } from "@workspace/customs-data";

import { ExpandIcon } from "../expand-icon";
import { highlightPrefix } from "../highlighting";

type ColumnFactoryParams = {
  codePrefix: string;
};

export function createCustomsColumns({
  codePrefix,
}: ColumnFactoryParams): ColumnDef<CustomsTreeNode>[] {
  return [
    {
      header: "Kodi",
      id: "code",
      accessorFn: (row) => row.code,
      cell: (info) => {
        const row = info.row;
        const value = info.getValue() as string;
        const renderedCode =
          codePrefix && value.startsWith(codePrefix)
            ? highlightPrefix(value, codePrefix)
            : value || "—";
        const canExpand = row.getCanExpand();
        const isExpanded = row.getIsExpanded();
        return (
          <div className="flex min-w-0 items-start gap-2">
            <div className="shrink-0" style={{ marginLeft: row.depth * 12 }}>
              {canExpand ? (
                <Button
                  onClick={row.getToggleExpandedHandler()}
                  aria-label={isExpanded ? "Tkurre" : "Zgjero"}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  type="button"
                >
                  <ExpandIcon expanded={isExpanded} />
                </Button>
              ) : (
                <span className="inline-block" style={{ width: 20 }} />
              )}
            </div>
            <span className="truncate font-mono" title={value}>
              {renderedCode}
            </span>
          </div>
        );
      },
    },
    {
      header: "Përshkrimi",
      id: "description",
      accessorKey: "description",
      cell: (info) => {
        const value = info.getValue() as string;
        const highlightHtml = info.row.original.highlightedDescription;
        return (
          <div
            className="break-words hyphens-auto truncate overflow-hidden"
            lang="sq"
            title={typeof value === "string" ? value : undefined}
            dangerouslySetInnerHTML={
              highlightHtml && highlightHtml.length
                ? { __html: highlightHtml }
                : undefined
            }
          >
            {!highlightHtml ? value || "—" : null}
          </div>
        );
      },
    },
    {
      header: "Bazë",
      accessorKey: "percentage",
      cell: (info) => <span>{formatPercent(info.getValue() as number)}</span>,
    },
    {
      header: "CEFTA",
      accessorKey: "cefta",
      cell: (info) => <span>{formatPercent(info.getValue() as number)}</span>,
    },
    {
      header: "MSA",
      accessorKey: "msa",
      cell: (info) => <span>{formatPercent(info.getValue() as number)}</span>,
    },
    {
      header: "TRMTL",
      accessorKey: "trmtl",
      cell: (info) => <span>{formatPercent(info.getValue() as number)}</span>,
    },
    {
      header: "TVSH",
      accessorKey: "tvsh",
      cell: (info) => <span>{formatPercent(info.getValue() as number)}</span>,
    },
    {
      header: "Aksizë",
      accessorKey: "excise",
      cell: (info) => <span>{formatPercent(info.getValue() as number)}</span>,
    },
    {
      header: "E vlefshme nga",
      accessorKey: "validFrom",
      cell: (info) => (
        <span className="text-xs">{formatDate(info.getValue())}</span>
      ),
    },
  ];
}
