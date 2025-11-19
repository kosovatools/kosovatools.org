"use client";

import * as React from "react";
import {
  Search,
  Layers,
  MoreHorizontal,
  Check,
  X,
  ListFilter,
  ChevronDown,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { SearchableListSection } from "./searchable-list-section";

export type StackedKeyTotal = {
  key: string;
  label: string;
  total: number;
};

export type StackedKeySelectorProps = {
  totals: StackedKeyTotal[];
  selectedKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  topCount: number;
  selectionLabel: string;
  searchPlaceholder: string;
  includeOther: boolean;
  onIncludeOtherChange: (next: boolean) => void;
  excludedKeys?: string[];
  onExcludedKeysChange?: (keys: string[]) => void;
  excludedSearchPlaceholder?: string;
  defaultOpen?: boolean;
};

export function StackedKeySelector({
  totals,
  selectedKeys,
  onSelectedKeysChange,
  topCount,
  selectionLabel,
  searchPlaceholder,
  includeOther,
  onIncludeOtherChange,
  excludedKeys: controlledExcludedKeys,
  onExcludedKeysChange,
  excludedSearchPlaceholder,
  defaultOpen = true,
}: StackedKeySelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [otherSearchTerm, setOtherSearchTerm] = React.useState("");
  const selectedListIdPrefix = React.useId();
  const excludedListIdPrefix = React.useId();

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedOtherSearch = otherSearchTerm.trim().toLowerCase();
  const otherDisabled = !includeOther;
  const excludedKeys = React.useMemo(
    () => controlledExcludedKeys ?? [],
    [controlledExcludedKeys],
  );
  const excludedSearchLabel = excludedSearchPlaceholder ?? searchPlaceholder;
  const toggleOthersButtonLabel = includeOther ? "Pastro" : "Të gjitha";

  const totalsWithValues = React.useMemo(
    () => totals.filter((item) => item.total !== 0),
    [totals],
  );

  const hasZeroTotals = totalsWithValues.length !== totals.length;

  const filteredTotals = React.useMemo(() => {
    if (!normalizedSearch) {
      return totalsWithValues;
    }
    return totalsWithValues.filter((item) =>
      item.label.toLowerCase().includes(normalizedSearch),
    );
  }, [totalsWithValues, normalizedSearch]);

  const handleToggleKey = React.useCallback(
    (key: string) => {
      const isSelected = selectedKeys.includes(key);
      const next = isSelected
        ? selectedKeys.filter((item) => item !== key)
        : [...selectedKeys, key];
      if (!isSelected && excludedKeys.includes(key)) {
        onExcludedKeysChange?.(excludedKeys.filter((item) => item !== key));
      }
      onSelectedKeysChange(next.length ? next : [key]);
    },
    [selectedKeys, onSelectedKeysChange, excludedKeys, onExcludedKeysChange],
  );

  const handleSelectTop = React.useCallback(() => {
    const source = normalizedSearch ? filteredTotals : totalsWithValues;
    const next = source.slice(0, Math.max(1, topCount)).map((item) => item.key);
    if (next.length) {
      onSelectedKeysChange(next);
    }
  }, [
    filteredTotals,
    normalizedSearch,
    onSelectedKeysChange,
    topCount,
    totalsWithValues,
  ]);

  const others = React.useMemo(() => {
    const excludedSet = new Set(excludedKeys);
    const base = totalsWithValues.filter(
      (item) => !selectedKeys.includes(item.key),
    );
    base.sort((a, b) => {
      const aExcluded = excludedSet.has(a.key);
      const bExcluded = excludedSet.has(b.key);
      if (aExcluded === bExcluded) return 0;
      return aExcluded ? -1 : 1;
    });
    return base;
  }, [totalsWithValues, selectedKeys, excludedKeys]);

  const visibleOthers = React.useMemo(() => {
    if (!normalizedOtherSearch) {
      return others;
    }
    return others.filter((item) =>
      item.label.toLowerCase().includes(normalizedOtherSearch),
    );
  }, [others, normalizedOtherSearch]);

  const handleExcludedStateChange = React.useCallback(
    (key: string, included: boolean) => {
      if (otherDisabled) {
        return;
      }
      const isExcluded = excludedKeys.includes(key);
      if (!included && !isExcluded) {
        onExcludedKeysChange?.([...excludedKeys, key]);
        return;
      }
      if (included && isExcluded) {
        onExcludedKeysChange?.(excludedKeys.filter((item) => item !== key));
      }
    },
    [otherDisabled, excludedKeys, onExcludedKeysChange],
  );

  const handleToggleOthers = React.useCallback(() => {
    setOtherSearchTerm("");
    if (includeOther) {
      onIncludeOtherChange(false);
      onExcludedKeysChange?.([]);
      return;
    }
    onIncludeOtherChange(true);
  }, [includeOther, onIncludeOtherChange, onExcludedKeysChange]);

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="flex min-w-0 flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="group flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground/90 hover:text-foreground outline-none">
          {selectionLabel}
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
          <span className="font-medium text-foreground">
            {selectedKeys.length}
          </span>
          <span>të zgjedhura</span>
          <span className="text-border">|</span>
          <span>{totalsWithValues.length} total</span>
        </div>
      </div>

      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="grid gap-6 md:grid-cols-2 md:items-start pt-2">
          <SearchableListSection
            icon={<Layers className="size-4 text-primary" />}
            title="Grupime"
            countLabel={`${filteredTotals.length}`}
            searchValue={searchTerm}
            onSearchValueChange={setSearchTerm}
            searchPlaceholder={searchPlaceholder}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectTop}
                className="h-7 gap-1.5 px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <ListFilter className="size-3.5" />
                Top {topCount}
              </Button>
            }
            listProps={{ role: "listbox", "aria-multiselectable": true }}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <Search className="size-8 opacity-20" />
                <p>Nuk u gjet asnjë rezultat.</p>
              </div>
            }
            items={filteredTotals}
            getItemConfig={(item) => {
              const checked = selectedKeys.includes(item.key);
              const checkboxId = `${selectedListIdPrefix}-${item.key}`;
              return {
                key: item.key,
                checkboxId,
                label: item.label,
                checked,
                onCheckedChange: () => handleToggleKey(item.key),
              };
            }}
          />

          <SearchableListSection
            icon={<MoreHorizontal className="size-4 text-muted-foreground" />}
            title="Të tjerat"
            countLabel={`${visibleOthers.length}`}
            searchValue={otherSearchTerm}
            onSearchValueChange={setOtherSearchTerm}
            searchPlaceholder={excludedSearchLabel}
            searchDisabled={otherDisabled}
            action={
              <Button
                variant={includeOther ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleOthers}
                className={cn(
                  "h-7 gap-1.5 px-2.5 text-[11px] font-medium transition-all",
                  includeOther
                    ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {includeOther ? (
                  <X className="size-3.5" />
                ) : (
                  <Check className="size-3.5" />
                )}
                {toggleOthersButtonLabel}
              </Button>
            }
            className={cn(
              "transition-opacity duration-300",
              otherDisabled && "opacity-80",
            )}
            listProps={{ role: "listbox", "aria-disabled": otherDisabled }}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                {otherDisabled ? (
                  <>
                    <Layers className="size-8 opacity-20" />
                    <p>Aktivizo "Të gjitha" për të parë listën.</p>
                  </>
                ) : (
                  <>
                    <Search className="size-8 opacity-20" />
                    <p>Nuk u gjet asnjë rezultat.</p>
                  </>
                )}
              </div>
            }
            items={visibleOthers}
            getItemConfig={(item) => {
              const isExcluded = excludedKeys.includes(item.key);
              const isIncluded = !isExcluded;
              const checkboxId = `${excludedListIdPrefix}-${item.key}`;
              return {
                key: item.key,
                checkboxId,
                label: item.label,
                checked: isIncluded,
                disabled: otherDisabled,
                ariaDisabled: otherDisabled,
                className: otherDisabled
                  ? "cursor-not-allowed opacity-50"
                  : undefined,
                onCheckedChange: (checked) =>
                  handleExcludedStateChange(item.key, checked === true),
              };
            }}
          />
        </div>

        {hasZeroTotals && (
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground/70 mt-6">
            <span className="block size-1.5 rounded-full bg-muted-foreground/40" />
            Elementet me total zero fshihen automatikisht nga listat.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
