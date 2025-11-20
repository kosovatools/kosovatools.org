"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import {
  FilterableCombobox,
  type FilterableComboboxOption,
} from "@workspace/ui/custom-components/filterable-combobox";

type Props = {
  description?: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: FilterableComboboxOption[];
  maxSelected: number;
  addPlaceholder?: string;
  maxSelectedPlaceholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptySelectionMessage?: string;
  removeButtonLabel?: string;
};

export function MultiSelectCombobox({
  description,
  selectedValues,
  onChange,
  options,
  maxSelected,
  addPlaceholder = "Shto një artikull...",
  maxSelectedPlaceholder = "Maksimumi i arritur",
  searchPlaceholder = "Kërko artikull...",
  emptyMessage = "Asnjë artikull nuk përputhet.",
  emptySelectionMessage = "Zgjedh të paktën një artikull për të shfaqur grafikun.",
  removeButtonLabel = "Hiq artikullin",
}: Props) {
  const labelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of options) {
      map.set(option.value, option.label);
    }
    return map;
  }, [options]);

  const filteredOptions = useMemo(
    () => options.filter((option) => !selectedValues.includes(option.value)),
    [options, selectedValues],
  );

  const canAddMore = selectedValues.length < maxSelected;
  const canRemove = selectedValues.length > 1;

  const handleAdd = (value: string | null) => {
    if (!value) return;
    if (selectedValues.includes(value)) return;
    if (selectedValues.length >= maxSelected) return;
    onChange([...selectedValues, value]);
  };

  const handleRemove = (value: string) => {
    if (selectedValues.length <= 1) return;
    onChange(selectedValues.filter((entry) => entry !== value));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="w-full max-w-sm">
          <FilterableCombobox
            value={null}
            onValueChange={handleAdd}
            options={filteredOptions}
            placeholder={canAddMore ? addPlaceholder : maxSelectedPlaceholder}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            disabled={!canAddMore || !filteredOptions.length}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedValues.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-sm"
          >
            <span className="max-w-[180px] truncate">
              {labelMap.get(value) ?? value}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(value)}
              className="text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={removeButtonLabel}
              disabled={!canRemove}
            >
              <X className="size-4" />
            </button>
          </span>
        ))}
        {!selectedValues.length ? (
          <span className="text-sm text-muted-foreground">
            {emptySelectionMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
