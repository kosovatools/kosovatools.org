"use client";

import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@workspace/ui/components/field";
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
  formatTotal: (value: number) => string;
  selectionLabel: string;
  searchPlaceholder: string;
  includeOther: boolean;
  onIncludeOtherChange: (next: boolean) => void;
  promoteLabel?: string;
  excludedKeys?: string[];
  onExcludedKeysChange?: (keys: string[]) => void;
  excludedSearchPlaceholder?: string;
};

export function StackedKeySelector({
  totals,
  selectedKeys,
  onSelectedKeysChange,
  topCount,
  formatTotal,
  selectionLabel,
  searchPlaceholder,
  includeOther,
  onIncludeOtherChange,
  promoteLabel = `Aktivizo grupimin "Të tjerët"`,
  excludedKeys: controlledExcludedKeys,
  onExcludedKeysChange,
  excludedSearchPlaceholder,
}: StackedKeySelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [otherSearchTerm, setOtherSearchTerm] = React.useState("");
  const includeOtherId = React.useId();
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

  const handleSelectAll = React.useCallback(() => {
    const source = normalizedSearch ? filteredTotals : totalsWithValues;
    const next = source.map((item) => item.key);
    if (next.length) {
      onSelectedKeysChange(next);
    }
  }, [
    filteredTotals,
    normalizedSearch,
    onSelectedKeysChange,
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

  const handleToggleExcluded = React.useCallback(
    (key: string) => {
      if (otherDisabled) {
        return;
      }
      const isExcluded = excludedKeys.includes(key);
      const next = isExcluded
        ? excludedKeys.filter((item) => item !== key)
        : [...excludedKeys, key];
      onExcludedKeysChange?.(next);
    },
    [otherDisabled, excludedKeys, onExcludedKeysChange],
  );

  const handleClearExcluded = React.useCallback(() => {
    if (otherDisabled) {
      return;
    }
    onExcludedKeysChange?.([]);
  }, [otherDisabled, onExcludedKeysChange]);

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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectTop}
            className="h-7 px-2 text-xs"
          >
            Më të mëdhenjtë {topCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-7 px-2 text-xs"
          >
            Të gjitha
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        <section className="flex max-h-[260px] min-w-0 flex-col gap-3 rounded-md border border-border/50 bg-background/40 p-3">
          <div className="flex flex-col gap-2">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 text-xs"
            />
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Grupime</span>
              <span className="font-normal opacity-70">
                {filteredTotals.length} rezultate
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden rounded-md border border-border/50 bg-background">
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
                      <span
                        className={cn(
                          "ml-auto flex-none rounded-full px-2 py-0.5 font-mono text-[11px]",
                          checked
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {formatTotal(item.total)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
        <section
          className={cn(
            "flex max-h-[260px] min-w-0 flex-col gap-3 rounded-md border border-border/50 bg-background/40 p-3 transition-opacity",
            otherDisabled && "opacity-60",
          )}
        >
          <div className="flex flex-col gap-2">
            <Field orientation="horizontal" className="flex items-start gap-2">
              <FieldContent className="flex-none pt-1">
                <Checkbox
                  id={includeOtherId}
                  checked={includeOther}
                  onCheckedChange={(checked) =>
                    onIncludeOtherChange(checked === true)
                  }
                />
              </FieldContent>
              <FieldContent className="flex flex-col gap-1">
                <FieldLabel
                  htmlFor={includeOtherId}
                  className="cursor-pointer font-medium text-muted-foreground"
                >
                  {promoteLabel}
                </FieldLabel>
              </FieldContent>
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="search"
                value={otherSearchTerm}
                onChange={(event) => setOtherSearchTerm(event.target.value)}
                placeholder={excludedSearchLabel}
                disabled={otherDisabled}
                className="h-8 flex-1 text-xs"
              />
              {onExcludedKeysChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearExcluded}
                  className="h-7 px-2 text-xs"
                  disabled={otherDisabled || excludedKeys.length === 0}
                >
                  Hiq zgjedhjet
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Përjashtime</span>
              <span className="font-normal opacity-70">
                {visibleOthers.length} elemente
              </span>
            </div>
          </div>
          <div
            className="flex-1 overflow-hidden rounded-md border border-border/50 bg-background"
            aria-disabled={otherDisabled}
          >
            <ul
              className="flex h-full flex-col gap-1 overflow-y-auto p-2"
              role="listbox"
            >
              {visibleOthers.length === 0 && (
                <li className="rounded-md px-2 py-2 text-muted-foreground">
                  {otherDisabled
                    ? 'Ndiz "Të tjerët" për të menaxhuar përjashtimet.'
                    : "Asnjë hyrje nuk përputhet me kërkimin."}
                </li>
              )}
              {visibleOthers.map((item) => {
                const isExcluded = excludedKeys.includes(item.key);
                const checkboxId = `${excludedListIdPrefix}-${item.key}`;
                return (
                  <li key={item.key}>
                    <label
                      htmlFor={checkboxId}
                      className={cn(
                        "group flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-md border border-transparent px-2 py-1 transition-colors",
                        isExcluded
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
                          checked={isExcluded}
                          disabled={otherDisabled}
                          onCheckedChange={() => handleToggleExcluded(item.key)}
                          className="size-3.5 flex-none"
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span
                        className={cn(
                          "ml-auto flex-none rounded-full px-2 py-0.5 font-mono text-[11px]",
                          isExcluded
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {formatTotal(item.total)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
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
