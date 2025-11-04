"use client";

import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export type TimeRangeOption = number | "all";

export type TimeRangeDefinition<T extends TimeRangeOption = TimeRangeOption> = {
  id: T;
  label: string;
};

export type TimeRangeSelectorProps<
  T extends TimeRangeOption = TimeRangeOption,
> = {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<TimeRangeDefinition<T>>;
  className?: string;
  disabled?: boolean;
  label?: React.ReactNode;
};

export function TimeRangeSelector<T extends TimeRangeOption>({
  value,
  onChange,
  options,
  className,
  disabled,
  label,
}: TimeRangeSelectorProps<T>) {
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
              className="px-3 py-1 text-xs"
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
