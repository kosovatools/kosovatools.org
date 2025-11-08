"use client";

import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export type SelectorOptionValue = string | number;

export type SelectorOptionDefinition<
  T extends SelectorOptionValue = SelectorOptionValue,
> = {
  key: T;
  label: React.ReactNode;
};

type OptionSelectorProps<T extends SelectorOptionValue = SelectorOptionValue> =
  {
    value: T;
    onChange: (value: T) => void;
    options: ReadonlyArray<SelectorOptionDefinition<T>>;
    className?: string;
    disabled?: boolean;
    label?: React.ReactNode;
  };

export function OptionSelector<T extends SelectorOptionValue>({
  value,
  onChange,
  options,
  className,
  disabled,
  label,
}: OptionSelectorProps<T>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
      {label ? (
        <span className="font-semibold uppercase tracking-wide text-muted-foreground text-[11px]">
          {label}
        </span>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const optionValue = option.key;
          const active = value === optionValue;
          return (
            <Button
              key={String(optionValue)}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => onChange(optionValue)}
              disabled={disabled}
              className="px-2 py-1 text-xs"
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
