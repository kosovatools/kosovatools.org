"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { CheckedState } from "@radix-ui/react-checkbox";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

export type SearchableListItemConfig = {
  key: React.Key;
  checkboxId: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  className?: string;
  ariaDisabled?: boolean;
  onCheckedChange: (state: CheckedState) => void;
};

export type SearchableListSectionProps<Item> = {
  title: string;
  countLabel: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  searchPlaceholder: string;
  action?: React.ReactNode;
  emptyState: React.ReactNode;
  items: Item[];
  getItemConfig: (item: Item) => SearchableListItemConfig;
  searchDisabled?: boolean;
  className?: string;
  listProps?: React.HTMLAttributes<HTMLUListElement>;
  icon?: React.ReactNode;
};

export function SearchableListSection<Item>({
  title,
  countLabel,
  searchValue,
  onSearchValueChange,
  searchPlaceholder,
  action,
  emptyState,
  items,
  getItemConfig,
  searchDisabled,
  className,
  listProps,
  icon,
}: SearchableListSectionProps<Item>) {
  const { className: listClassName, ...restListProps } = listProps ?? {};
  return (
    <section
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md hover:border-border/80",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {icon && <div className="text-muted-foreground/70">{icon}</div>}
          <span className="text-xs font-semibold text-foreground/80">
            {title}
          </span>
          <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm border border-border/50">
            {countLabel}
          </span>
        </div>
        {action}
      </div>

      {/* Search */}
      <div className="relative border-b border-border/40 px-3 py-2">
        <Search className="absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchValueChange(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={searchDisabled}
          className="h-8 border-border/40 bg-background/50 pl-8 text-xs focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20"
        />
      </div>

      {/* List */}
      <ul
        className={cn(
          "flex h-[280px] flex-col gap-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          listClassName,
        )}
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
                      "group/item flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-all duration-200",
                      config.checked
                        ? "bg-primary/5 text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      config.disabled && "opacity-50 cursor-not-allowed",
                      config.className,
                    )}
                    aria-disabled={config.ariaDisabled}
                  >
                    <div className="relative flex items-center justify-center">
                      <Checkbox
                        id={config.checkboxId}
                        checked={config.checked}
                        disabled={config.disabled}
                        onCheckedChange={config.onCheckedChange}
                        className={cn(
                          "size-4 transition-transform duration-200 group-active/item:scale-95",
                          config.checked
                            ? "border-primary"
                            : "border-muted-foreground/40",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "truncate text-xs font-medium leading-none",
                        config.checked
                          ? "text-foreground"
                          : "text-muted-foreground group-hover/item:text-foreground",
                      )}
                    >
                      {config.label}
                    </span>
                  </label>
                </li>
              );
            })}
      </ul>
    </section>
  );
}
