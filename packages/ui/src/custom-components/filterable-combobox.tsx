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

export interface FilterableComboboxProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: FilterableComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxResults?: number;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
}

export function FilterableCombobox({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  maxResults = 100,
  disabled,
  triggerClassName,
  contentClassName,
}: FilterableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = React.useMemo(() => {
    if (value == null || value === "") {
      return null;
    }

    return options.find((item) => item.value === value) ?? null;
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) {
      return options.slice(0, maxResults);
    }

    return options
      .filter((option) => {
        const haystack = [
          option.label,
          option.notes ?? "",
          ...(option.keywords ?? []),
        ].join(" ");
        return haystack.toLowerCase().includes(trimmed);
      })
      .slice(0, maxResults);
  }, [maxResults, options, search]);

  const handleToggle = (nextOpen: boolean) => {
    if (disabled) {
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  };

  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
      setSearch("");
    }
  }, [disabled, open]);

  return (
    <Popover open={disabled ? false : open} onOpenChange={handleToggle}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "min-w-0 w-full max-w-full shrink justify-between gap-2 overflow-hidden text-left",
            "data-[placeholder=true]:text-muted-foreground",
            triggerClassName,
          )}
          disabled={disabled}
          data-placeholder={selectedOption ? undefined : true}
          title={selectedOption ? selectedOption.label : undefined}
        >
          <span className="min-w-0 flex-1 truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[320px] p-0", contentClassName)}>
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
                const isSelected = option.value === value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    className="flex items-start gap-2"
                    onSelect={() => {
                      onValueChange(isSelected ? null : option.value);
                      handleToggle(false);
                    }}
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
