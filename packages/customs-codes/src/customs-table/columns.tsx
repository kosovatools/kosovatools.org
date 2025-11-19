"use client";

import type { ReactNode } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { Filter, X } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import type { CustomsTreeNode } from "../types";

import { ExpandIcon } from "../expand-icon";
import { highlightPrefix } from "../highlighting";
import { formatDate, formatPercent, isFiniteNumber } from "@workspace/utils";

type ColumnFactoryParams = {
  getCodePrefix: () => string;
  getIdQuery: () => string;
  onIdQueryChange: (value: string) => void;
  getDescQuery: () => string;
  onDescQueryChange: (value: string) => void;
  isCodeFilterOpen: boolean;
  onToggleCodeFilter: () => void;
  isDescFilterOpen: boolean;
  onToggleDescFilter: () => void;
};

function formatCustomsRate(value: number | null | undefined) {
  return formatPercent(isFiniteNumber(value) ? value / 100 : null);
}

export function createCustomsColumns({
  getCodePrefix,
  getIdQuery,
  onIdQueryChange,
  getDescQuery,
  onDescQueryChange,
  isCodeFilterOpen,
  onToggleCodeFilter,
  isDescFilterOpen,
  onToggleDescFilter,
}: ColumnFactoryParams): ColumnDef<CustomsTreeNode>[] {
  return [
    {
      header: () => {
        const idQueryValue = getIdQuery();
        return (
          <FilterableHeader
            label="Kodi"
            active={isCodeFilterOpen}
            hasActiveFilter={Boolean(idQueryValue)}
            onToggle={onToggleCodeFilter}
          >
            <Input
              value={idQueryValue}
              onChange={(event) => onIdQueryChange(event.currentTarget.value)}
              placeholder="p.sh. 7208 ose 01"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Filtro sipas prefiksit të kodit"
              className="h-8 w-full normal-case text-xs font-normal tracking-normal"
            />
          </FilterableHeader>
        );
      },
      id: "code",
      accessorFn: (row) => row.code,
      cell: (info) => {
        const row = info.row;
        const value = info.getValue() as string;
        const codePrefix = getCodePrefix();
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
      header: () => {
        const descQueryValue = getDescQuery();
        return (
          <FilterableHeader
            label="Përshkrimi"
            active={isDescFilterOpen}
            hasActiveFilter={Boolean(descQueryValue)}
            onToggle={onToggleDescFilter}
          >
            <Input
              value={descQueryValue}
              onChange={(event) => onDescQueryChange(event.currentTarget.value)}
              placeholder='p.sh. "tub çeliku"'
              autoComplete="off"
              aria-label="Filtro sipas përshkrimit"
              className="h-8 w-full normal-case text-xs font-normal tracking-normal"
            />
          </FilterableHeader>
        );
      },
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
      header: () => <ColumnHeaderLabel>Bazë</ColumnHeaderLabel>,
      accessorKey: "percentage",
      cell: (info) => (
        <span>{formatCustomsRate(info.getValue() as number | null | undefined)}</span>
      ),
    },
    {
      header: () => <ColumnHeaderLabel>CEFTA</ColumnHeaderLabel>,
      accessorKey: "cefta",
      cell: (info) => (
        <span>{formatCustomsRate(info.getValue() as number | null | undefined)}</span>
      ),
    },
    {
      header: () => <ColumnHeaderLabel>MSA</ColumnHeaderLabel>,
      accessorKey: "msa",
      cell: (info) => (
        <span>{formatCustomsRate(info.getValue() as number | null | undefined)}</span>
      ),
    },
    {
      header: () => <ColumnHeaderLabel>TRMTL</ColumnHeaderLabel>,
      accessorKey: "trmtl",
      cell: (info) => (
        <span>{formatCustomsRate(info.getValue() as number | null | undefined)}</span>
      ),
    },
    {
      header: () => <ColumnHeaderLabel>TVSH</ColumnHeaderLabel>,
      accessorKey: "tvsh",
      cell: (info) => (
        <span>{formatCustomsRate(info.getValue() as number | null | undefined)}</span>
      ),
    },
    {
      header: () => <ColumnHeaderLabel>Aksizë</ColumnHeaderLabel>,
      accessorKey: "excise",
      cell: (info) => (
        <span>{formatCustomsRate(info.getValue() as number | null | undefined)}</span>
      ),
    },
    {
      header: () => <ColumnHeaderLabel>E vlefshme nga</ColumnHeaderLabel>,
      accessorKey: "validFrom",
      cell: (info) => (
        <span className="text-xs">{formatDate(info.getValue() as string)}</span>
      ),
    },
  ];
}

type FilterableHeaderProps = {
  label: string;
  active: boolean;
  hasActiveFilter?: boolean;
  children: ReactNode;
  onToggle: () => void;
};

function FilterableHeader({
  label,
  active,
  hasActiveFilter,
  children,
  onToggle,
}: FilterableHeaderProps) {
  const iconLabel = active
    ? `Mbyll filtrin për ${label}`
    : `Hap filtrin për ${label}`;
  return (
    <div className="space-y-1">
      <div className="flex h-9 w-full items-center gap-2">
        {active ? (
          <>
            <div className="flex-1">{children}</div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label={iconLabel}
              aria-pressed={active}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </>
        ) : (
          <>
            <ColumnHeaderLabel>{label}</ColumnHeaderLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label={iconLabel}
              aria-pressed={active}
              className={`relative h-6 w-6 text-muted-foreground hover:text-foreground ${
                hasActiveFilter ? "text-foreground" : ""
              }`}
            >
              <Filter className="h-3.5 w-3.5" aria-hidden />
              {hasActiveFilter ? (
                <>
                  <span
                    aria-hidden
                    className="absolute right-1 top-1 block h-1.5 w-1.5 rounded-full bg-primary"
                  />
                  <span className="sr-only">Filtri aktiv</span>
                </>
              ) : null}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ColumnHeaderLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
