"use client";

import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

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
    <div className="flex min-w-0 flex-col gap-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-medium text-muted-foreground">
            {selectionLabel}
          </span>
          <span className="text-muted-foreground opacity-80">
            {selectedKeys.length} zgjedhje · {totalsWithValues.length} në total
          </span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        <section className="flex max-h-[260px] min-w-0 flex-col gap-3 rounded-md border border-border/50 bg-background/40 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Grupime</span>
            <span className="font-normal opacity-70">
              {filteredTotals.length} rezultate
            </span>
          </div>
          <div className="flex flex-row gap-1">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectTop}
              className="h-7 px-2 text-xs"
            >
              Top {topCount}
            </Button>
          </div>
          <ul
            className="flex h-full flex-col gap-1 overflow-y-auto p-2"
            role="listbox"
            aria-multiselectable
          >
            {filteredTotals.length === 0 && (
              <li className="rounded-md px-2 py-2 text-muted-foreground">
                Asnjë hyrje nuk përputhet me kërkimin.
              </li>
            )}
            {filteredTotals.map((item) => {
              const checked = selectedKeys.includes(item.key);
              const checkboxId = `${selectedListIdPrefix}-${item.key}`;
              return (
                <li key={item.key}>
                  <label
                    htmlFor={checkboxId}
                    className={cn(
                      "group flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-md border border-transparent px-2 py-1 transition-colors",
                      checked
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "hover:border-border hover:bg-muted",
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        onCheckedChange={() => handleToggleKey(item.key)}
                        className="size-3.5 flex-none"
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
        <section
          className={cn(
            "flex max-h-[260px] min-w-0 flex-col gap-3 rounded-md border border-border/50 bg-background/40 p-3 transition-opacity",
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Të tjerat</span>
            <span className="font-normal opacity-70">
              {visibleOthers.length} elemente
            </span>
          </div>
          <div className="flex flex-row gap-1">
            <Input
              type="search"
              value={otherSearchTerm}
              onChange={(event) => setOtherSearchTerm(event.target.value)}
              placeholder={excludedSearchLabel}
              disabled={otherDisabled}
              className="h-8 flex-1 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleOthers}
              className="h-7 px-2 text-xs"
            >
              {toggleOthersButtonLabel}
            </Button>
          </div>

          <ul
            className="flex h-full flex-col gap-1 overflow-y-auto p-2"
            aria-disabled={otherDisabled}
            role="listbox"
          >
            {visibleOthers.length === 0 && (
              <li className="rounded-md px-2 py-2 text-muted-foreground">
                {otherDisabled
                  ? 'Kliko "Të gjitha" për të hapur listën.'
                  : "Asnjë hyrje nuk përputhet me kërkimin."}
              </li>
            )}
            {visibleOthers.map((item) => {
              const isExcluded = excludedKeys.includes(item.key);
              const isIncluded = !isExcluded;
              const checkboxId = `${excludedListIdPrefix}-${item.key}`;
              return (
                <li key={item.key}>
                  <label
                    htmlFor={checkboxId}
                    className={cn(
                      "group flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-md border border-transparent px-2 py-1 transition-colors",
                      isIncluded
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "hover:border-border hover:bg-muted",
                      otherDisabled &&
                      "cursor-not-allowed border-transparent hover:bg-transparent",
                    )}
                    aria-disabled={otherDisabled}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <Checkbox
                        id={checkboxId}
                        checked={isIncluded}
                        disabled={otherDisabled}
                        onCheckedChange={(checked) =>
                          handleExcludedStateChange(item.key, checked === true)
                        }
                        className="size-3.5 flex-none"
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
      {hasZeroTotals && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Elementet me total zero fshihen nga listat e përfshirjes dhe
          përjashtimit.
        </p>
      )}
    </div>
  );
}
