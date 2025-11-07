"use client";

import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export type SelectorOptionValue = string | number;

export type SelectorOptionDefinition<
  T extends SelectorOptionValue = SelectorOptionValue,
> = {
  id: T;
  label: React.ReactNode;
};

export type TimeRangeOption = number | "all";

export type TimeRangeDefinition<T extends TimeRangeOption = TimeRangeOption> =
  SelectorOptionDefinition<T>;

export type OptionSelectorProps<
  T extends SelectorOptionValue = SelectorOptionValue,
> = {
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
          const active = value === option.id;
          return (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => onChange(option.id)}
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
