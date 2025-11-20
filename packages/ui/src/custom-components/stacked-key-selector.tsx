"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  Layers,
  ListFilter,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { SearchableListSection } from "./searchable-list-section";

export type StackedKeyTotal = {
  key: string;
  label: string;
  total: number;
};

export type StackedKeySelectionState = {
  selectedKeys: string[];
  includeOther: boolean;
  excludedKeys: string[];
};

type NormalizeStackedKeySelectionArgs = {
  selection: StackedKeySelectionState;
  totals: StackedKeyTotal[];
  topCount: number;
  initialSelectedKeys?: string[];
  previousDefaultKeys?: string[];
};

export type StackedKeySelectorProps = {
  totals: StackedKeyTotal[];
  topCount: number;
  selectionLabel: string;
  searchPlaceholder: string;
  defaultOpen?: boolean;
  excludedSearchPlaceholder?: string;

  selection?: StackedKeySelectionState;
  onSelectionChange?: (selection: StackedKeySelectionState) => void;

  initialSelectedKeys?: string[];
  initialIncludeOther?: boolean;
  initialExcludedKeys?: string[];
};

function areKeyArraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}

function areSelectionsEqual(
  a: StackedKeySelectionState,
  b: StackedKeySelectionState,
): boolean {
  return (
    a.includeOther === b.includeOther &&
    areKeyArraysEqual(a.selectedKeys, b.selectedKeys) &&
    areKeyArraysEqual(a.excludedKeys, b.excludedKeys)
  );
}

export function getDefaultStackedKeys(
  totals: StackedKeyTotal[],
  topCount: number,
): string[] {
  if (!totals.length) {
    return [];
  }
  const limit = Math.max(1, Math.min(topCount, totals.length));
  return totals.slice(0, limit).map((item) => item.key);
}

export function createInitialStackedKeySelection({
  totals,
  topCount,
  initialSelectedKeys,
  initialIncludeOther,
  initialExcludedKeys,
}: {
  totals: StackedKeyTotal[];
  topCount: number;
  initialSelectedKeys?: string[];
  initialIncludeOther?: boolean;
  initialExcludedKeys?: string[];
}): StackedKeySelectionState {
  const defaultKeys = getDefaultStackedKeys(totals, topCount);
  const selectedKeys = initialSelectedKeys?.length
    ? initialSelectedKeys
    : defaultKeys;
  const includeOther =
    typeof initialIncludeOther === "boolean"
      ? initialIncludeOther
      : totals.length > defaultKeys.length;
  const excludedKeys =
    initialExcludedKeys?.filter((key) =>
      totals.some((item) => item.key === key),
    ) ?? [];

  return { selectedKeys, includeOther, excludedKeys };
}

export function normalizeStackedKeySelection({
  selection,
  totals,
  topCount,
  initialSelectedKeys,
  previousDefaultKeys,
}: NormalizeStackedKeySelectionArgs): StackedKeySelectionState {
  const defaultKeys = getDefaultStackedKeys(totals, topCount);
  const previousDefault = previousDefaultKeys ?? defaultKeys;

  if (!totals.length) {
    return {
      selectedKeys: [],
      includeOther: selection.includeOther,
      excludedKeys: [],
    };
  }

  const validKeys = new Set(totals.map((item) => item.key));
  const filteredSelected = selection.selectedKeys.filter((key) =>
    validKeys.has(key),
  );

  let nextSelected: string[];

  if (filteredSelected.length === selection.selectedKeys.length) {
    if (filteredSelected.length) {
      nextSelected = filteredSelected;
    } else if (initialSelectedKeys?.length) {
      const fallback = initialSelectedKeys.filter((key) => validKeys.has(key));
      nextSelected = fallback.length ? fallback : defaultKeys;
    } else {
      nextSelected = defaultKeys;
    }
  } else {
    nextSelected = filteredSelected.length ? filteredSelected : defaultKeys;
  }

  if (
    !areKeyArraysEqual(previousDefault, defaultKeys) &&
    areKeyArraysEqual(selection.selectedKeys, previousDefault)
  ) {
    nextSelected = defaultKeys;
  }

  const nextExcluded = selection.excludedKeys.filter((key) =>
    validKeys.has(key),
  );

  return {
    selectedKeys: nextSelected,
    includeOther: selection.includeOther,
    excludedKeys: nextExcluded,
  };
}

export function StackedKeySelector({
  totals,
  topCount,
  selectionLabel,
  searchPlaceholder,
  defaultOpen = true,
  excludedSearchPlaceholder,
  selection,
  onSelectionChange,
  initialSelectedKeys,
  initialIncludeOther,
  initialExcludedKeys,
}: StackedKeySelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [otherSearchTerm, setOtherSearchTerm] = React.useState("");
  const selectedListIdPrefix = React.useId();
  const excludedListIdPrefix = React.useId();

  const defaultKeys = React.useMemo(
    () => getDefaultStackedKeys(totals, topCount),
    [totals, topCount],
  );
  const previousDefaultKeysRef = React.useRef(defaultKeys);

  const [internalSelection, setInternalSelection] =
    React.useState<StackedKeySelectionState>(() =>
      createInitialStackedKeySelection({
        totals,
        topCount,
        initialSelectedKeys: selection?.selectedKeys ?? initialSelectedKeys,
        initialIncludeOther: selection?.includeOther ?? initialIncludeOther,
        initialExcludedKeys: selection?.excludedKeys ?? initialExcludedKeys,
      }),
    );

  const selectionValue = selection ?? internalSelection;
  const isSelectionControlled = Boolean(selection);

  React.useEffect(() => {
    const normalized = normalizeStackedKeySelection({
      selection: selectionValue,
      totals,
      topCount,
      initialSelectedKeys: selection?.selectedKeys ?? initialSelectedKeys,
      previousDefaultKeys: previousDefaultKeysRef.current,
    });

    previousDefaultKeysRef.current = defaultKeys;
    if (!areSelectionsEqual(normalized, selectionValue)) {
      if (isSelectionControlled) {
        onSelectionChange?.(normalized);
      } else {
        setInternalSelection(normalized);
        onSelectionChange?.(normalized);
      }
    }
  }, [
    selectionValue,
    selection,
    totals,
    topCount,
    defaultKeys,
    initialSelectedKeys,
    isSelectionControlled,
    onSelectionChange,
  ]);

  const updateSelection = React.useCallback(
    (
      updater:
        | StackedKeySelectionState
        | ((current: StackedKeySelectionState) => StackedKeySelectionState),
    ) => {
      if (isSelectionControlled) {
        const next =
          typeof updater === "function" ? updater(selectionValue) : updater;
        onSelectionChange?.(next);
        return;
      }
      setInternalSelection((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        onSelectionChange?.(next);
        return next;
      });
    },
    [isSelectionControlled, selectionValue, onSelectionChange],
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedOtherSearch = otherSearchTerm.trim().toLowerCase();
  const excludedKeys = selectionValue.excludedKeys;
  const excludedSearchLabel = excludedSearchPlaceholder ?? searchPlaceholder;

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
      updateSelection((current) => {
        const isSelected = current.selectedKeys.includes(key);
        let nextSelected = isSelected
          ? current.selectedKeys.filter((item) => item !== key)
          : [...current.selectedKeys, key];
        if (!nextSelected.length) {
          nextSelected = [key];
        }
        const nextExcluded = isSelected
          ? current.excludedKeys
          : current.excludedKeys.filter((item) => item !== key);
        return {
          ...current,
          selectedKeys: nextSelected,
          excludedKeys: nextExcluded,
        };
      });
    },
    [updateSelection],
  );

  const handleSelectTop = React.useCallback(() => {
    const source = normalizedSearch ? filteredTotals : totalsWithValues;
    const next = source.slice(0, Math.max(1, topCount)).map((item) => item.key);
    if (next.length) {
      updateSelection((current) => ({ ...current, selectedKeys: next }));
    }
  }, [
    filteredTotals,
    normalizedSearch,
    topCount,
    totalsWithValues,
    updateSelection,
  ]);

  const others = React.useMemo(() => {
    const excludedSet = new Set(excludedKeys);
    const base = totalsWithValues.filter(
      (item) => !selectionValue.selectedKeys.includes(item.key),
    );
    base.sort((a, b) => {
      const aExcluded = excludedSet.has(a.key);
      const bExcluded = excludedSet.has(b.key);
      if (aExcluded === bExcluded) return 0;
      return aExcluded ? -1 : 1;
    });
    return base;
  }, [totalsWithValues, selectionValue.selectedKeys, excludedKeys]);

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
      updateSelection((current) => {
        const isExcluded = current.excludedKeys.includes(key);
        if (!included && !isExcluded) {
          return { ...current, excludedKeys: [...current.excludedKeys, key] };
        }
        if (included && isExcluded) {
          return {
            ...current,
            excludedKeys: current.excludedKeys.filter((item) => item !== key),
          };
        }
        return current;
      });
    },
    [updateSelection],
  );

  const handleIncludeAllOthers = React.useCallback(() => {
    setOtherSearchTerm("");
    updateSelection((current) => ({
      ...current,
      includeOther: true,
      excludedKeys: [],
    }));
  }, [updateSelection]);

  const handleClearOthers = React.useCallback(() => {
    setOtherSearchTerm("");
    updateSelection((current) => ({
      ...current,
      includeOther: false,
      excludedKeys: totalsWithValues
        .filter((item) => !current.selectedKeys.includes(item.key))
        .map((item) => item.key),
    }));
  }, [totalsWithValues, updateSelection]);

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="group flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground/90 hover:text-foreground outline-none">
          {selectionLabel}
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
          <span className="font-medium text-foreground">
            {selectionValue.selectedKeys.length}
          </span>
          <span>të zgjedhura</span>
          <span className="text-border">|</span>
          <span>{totalsWithValues.length} total</span>
        </div>
      </div>

      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="grid gap-3 md:grid-cols-2 md:items-start">
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
              const checked = selectionValue.selectedKeys.includes(item.key);
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
            action={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearOthers}
                  className="h-7 gap-1.5 px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                  Pastro
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleIncludeAllOthers}
                  className="h-7 gap-1.5 px-2.5 text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                >
                  <Check className="size-3.5" />
                  Të gjitha
                </Button>
              </div>
            }
            listProps={{ role: "listbox" }}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <Search className="size-8 opacity-20" />
                <p>Nuk u gjet asnjë rezultat.</p>
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
