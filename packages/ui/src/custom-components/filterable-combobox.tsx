"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

export interface FilterableComboboxOption {
  value: string;
  label: string;
  keywords?: string[];
  notes?: string;
}

type BaseComboboxProps = {
  options: FilterableComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxResults?: number;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
};

type SingleComboboxProps = BaseComboboxProps & {
  multiple?: false;
  value: string | null;
  onChange: (value: string | null) => void;
};

type MultiComboboxProps = BaseComboboxProps & {
  multiple: true;
  value: string[];
  onChange: (values: string[]) => void;
  maxSelected?: number;
  minSelected?: number;
  selectionDisplayLimit?: number;
  emptySelectionPlaceholder?: string;
};

export type FilterableComboboxProps = SingleComboboxProps | MultiComboboxProps;

export function FilterableCombobox(props: FilterableComboboxProps) {
  const {
    options,
    emptyMessage = "No results found.",
    maxResults = 100,
    searchPlaceholder = "Search...",
    disabled,
    triggerClassName,
    contentClassName,
  } = props;

  const value = props.value;
  const isMultiple = props.multiple === true;
  const placeholder = props.placeholder
    ? props.placeholder
    : isMultiple
      ? "Select options..."
      : "Select an option...";
  const emptySelectionPlaceholder = isMultiple
    ? (props.emptySelectionPlaceholder ?? placeholder)
    : placeholder;
  const selectionDisplayLimit = isMultiple
    ? (props.selectionDisplayLimit ?? 3)
    : 0;
  const minSelected = isMultiple ? (props.minSelected ?? 0) : 0;
  const maxSelected = isMultiple ? props.maxSelected : undefined;
  const safeMaxResults = Math.max(1, maxResults);

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const optionLookup = React.useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );

  const selectedValues = React.useMemo(() => {
    if (isMultiple) {
      return Array.isArray(value) ? value : [];
    }
    if (Array.isArray(value)) {
      return [];
    }
    return value ? [value] : [];
  }, [isMultiple, value]);

  const selectedSet = React.useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const selectedOptions = React.useMemo(
    () =>
      selectedValues.map(
        (value) => optionLookup.get(value) ?? { value, label: value },
      ),
    [optionLookup, selectedValues],
  );

  const selectedOption = React.useMemo(() => {
    if (isMultiple || Array.isArray(value) || !value) return null;
    return optionLookup.get(value) ?? null;
  }, [isMultiple, optionLookup, value]);

  const reachedMaxSelected =
    isMultiple &&
    typeof maxSelected === "number" &&
    selectedValues.length >= maxSelected;

  const selectionTitle = React.useMemo(() => {
    if (!selectedOptions.length) {
      return undefined;
    }
    return selectedOptions.map((option) => option.label).join(", ");
  }, [selectedOptions]);

  const extraSelectionCount = isMultiple
    ? Math.max(0, selectedOptions.length - selectionDisplayLimit)
    : 0;

  const filteredOptions = React.useMemo(
    () =>
      filterOptions({
        options,
        search,
        maxResults: safeMaxResults,
        selectedSet,
      }),
    [options, search, safeMaxResults, selectedSet],
  );

  const handleToggle = React.useCallback(
    (nextOpen: boolean) => {
      if (disabled) {
        return;
      }

      setOpen(nextOpen);
      if (!nextOpen) {
        setSearch("");
      }
    },
    [disabled],
  );

  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
      setSearch("");
    }
  }, [disabled, open]);

  const handleSelect = React.useCallback(
    (optionValue: string) => {
      if (props.multiple) {
        const isSelected = selectedSet.has(optionValue);
        if (isSelected) {
          if (selectedValues.length <= minSelected) {
            return;
          }
          const nextValues = selectedValues.filter(
            (value) => value !== optionValue,
          );
          props.onChange(nextValues);
          return;
        }

        if (reachedMaxSelected) {
          return;
        }

        props.onChange([...selectedValues, optionValue]);
        return;
      }

      const isSelected = selectedOption?.value === optionValue;
      const nextValue = isSelected ? null : optionValue;
      props.onChange(nextValue);
      handleToggle(false);
    },
    [
      minSelected,
      handleToggle,
      props,
      reachedMaxSelected,
      selectedOption?.value,
      selectedSet,
      selectedValues,
    ],
  );

  return (
    <Popover open={disabled ? false : open} onOpenChange={handleToggle}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "min-w-0 w-full md:w-auto shrink justify-between gap-1 text-left",
            "data-[placeholder=true]:text-muted-foreground",
            isMultiple ? "h-auto py-2" : "overflow-hidden",
            triggerClassName,
          )}
          disabled={disabled}
          data-placeholder={selectedValues.length ? undefined : true}
          title={selectionTitle ?? selectedOption?.label}
        >
          {isMultiple ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                {selectedOptions.length ? (
                  <>
                    {extraSelectionCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                        +{extraSelectionCount}
                      </span>
                    ) : null}
                    {selectedOptions
                      .slice(0, selectionDisplayLimit)
                      .map((option) => (
                        <span
                          key={option.value}
                          className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs leading-tight"
                        >
                          <span className="truncate">{option.label}</span>
                        </span>
                      ))}
                  </>
                ) : (
                  <span className="truncate">{emptySelectionPlaceholder}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-px size-4 shrink-0 opacity-50" />
            </>
          ) : (
            <>
              <span className="min-w-0 flex-1 truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={4}
        className={cn("overflow-hidden p-0", contentClassName)}
        style={{
          width:
            "min(var(--radix-popover-trigger-width), 320px, calc(100vw - 24px))",
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = selectedSet.has(option.value);
                const isMaxedOut =
                  isMultiple && reachedMaxSelected && !isSelected;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "flex items-start gap-2",
                      isMaxedOut && "cursor-not-allowed opacity-60",
                    )}
                    onSelect={() => {
                      if (isMaxedOut) return;
                      handleSelect(option.value);
                    }}
                    aria-disabled={isMaxedOut}
                  >
                    <Check
                      className={cn(
                        "mt-1 size-4 flex-none",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-5">
                        {option.label}
                      </span>
                      {option.notes ? (
                        <span className="text-xs leading-5 text-muted-foreground">
                          {option.notes}
                        </span>
                      ) : null}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function filterOptions({
  options,
  search,
  maxResults,
  selectedSet,
}: {
  options: FilterableComboboxOption[];
  search: string;
  maxResults: number;
  selectedSet: Set<string>;
}) {
  const trimmed = search.trim().toLowerCase();
  const baseList = trimmed
    ? options.filter((option) => {
        const haystack = [
          option.label,
          option.notes ?? "",
          ...(option.keywords ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(trimmed);
      })
    : options;

  const seen = new Set<string>();
  const selected: FilterableComboboxOption[] = [];
  const unselected: FilterableComboboxOption[] = [];

  for (const option of baseList) {
    if (seen.has(option.value)) {
      continue;
    }
    seen.add(option.value);

    if (selectedSet.has(option.value)) {
      selected.push(option);
    } else {
      unselected.push(option);
    }
  }

  return [...selected, ...unselected].slice(0, maxResults);
}
