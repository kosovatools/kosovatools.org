"use client";

import * as React from "react";

import type { CheckedState } from "@radix-ui/react-checkbox";

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
        <SearchableListSection
          title="Grupime"
          countLabel={`${filteredTotals.length} rezultate`}
          searchValue={searchTerm}
          onSearchValueChange={setSearchTerm}
          searchPlaceholder={searchPlaceholder}
          actionLabel={`Top ${topCount}`}
          onAction={handleSelectTop}
          listProps={{ role: "listbox", "aria-multiselectable": true }}
          emptyState={
            <li className="rounded-md px-2 py-2 text-muted-foreground">
              Asnjë hyrje nuk përputhet me kërkimin.
            </li>
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
          title="Të tjerat"
          countLabel={`${visibleOthers.length} elemente`}
          searchValue={otherSearchTerm}
          onSearchValueChange={setOtherSearchTerm}
          searchPlaceholder={excludedSearchLabel}
          searchDisabled={otherDisabled}
          actionLabel={toggleOthersButtonLabel}
          onAction={handleToggleOthers}
          className="transition-opacity"
          inputClassName="flex-1"
          listProps={{ role: "listbox", "aria-disabled": otherDisabled }}
          emptyState={
            <li className="rounded-md px-2 py-2 text-muted-foreground">
              {otherDisabled
                ? 'Kliko "Të gjitha" për të hapur listën.'
                : "Asnjë hyrje nuk përputhet me kërkimin."}
            </li>
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
                ? "cursor-not-allowed border-transparent hover:bg-transparent"
                : undefined,
              onCheckedChange: (checked) =>
                handleExcludedStateChange(item.key, checked === true),
            };
          }}
        />
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

type SearchableListItemConfig = {
  key: React.Key;
  checkboxId: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  className?: string;
  ariaDisabled?: boolean;
  onCheckedChange: (state: CheckedState) => void;
};

type SearchableListSectionProps<Item> = {
  title: string;
  countLabel: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  searchPlaceholder: string;
  actionLabel: string;
  onAction: () => void;
  emptyState: React.ReactNode;
  items: Item[];
  getItemConfig: (item: Item) => SearchableListItemConfig;
  searchDisabled?: boolean;
  actionDisabled?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  listProps?: React.HTMLAttributes<HTMLUListElement>;
};

function SearchableListSection<Item>({
  title,
  countLabel,
  searchValue,
  onSearchValueChange,
  searchPlaceholder,
  actionLabel,
  onAction,
  emptyState,
  items,
  getItemConfig,
  searchDisabled,
  actionDisabled,
  className,
  inputClassName,
  buttonClassName,
  listProps,
}: SearchableListSectionProps<Item>) {
  const { className: listClassName, ...restListProps } = listProps ?? {};
  return (
    <section
      className={cn(
        "flex max-h-[260px] min-w-0 flex-col gap-3 rounded-md border border-border/50 bg-background/40 p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{title}</span>
        <span className="font-normal opacity-70">{countLabel}</span>
      </div>
      <div className="flex flex-row gap-1">
        <Input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchValueChange(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={searchDisabled}
          className={cn("h-8 text-xs", inputClassName)}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onAction}
          className={cn("h-7 px-2 text-xs", buttonClassName)}
          disabled={actionDisabled}
        >
          {actionLabel}
        </Button>
      </div>
      <ul
        className={cn("flex h-full flex-col gap-1 overflow-y-auto p-2", listClassName)}
        {...restListProps}
      >
        {items.length === 0
          ? emptyState
          : items.map((item) => {
            const config = getItemConfig(item);
            return (
              <li key={config.key}>
                <label
                  htmlFor={config.checkboxId}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-md border border-transparent px-2 py-1 transition-colors",
                    config.checked
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "hover:border-border hover:bg-muted",
                    config.className,
                  )}
                  aria-disabled={config.ariaDisabled}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <Checkbox
                      id={config.checkboxId}
                      checked={config.checked}
                      disabled={config.disabled}
                      onCheckedChange={config.onCheckedChange}
                      className="size-3.5 flex-none"
                    />
                    <span className="truncate">{config.label}</span>
                  </span>
                </label>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
