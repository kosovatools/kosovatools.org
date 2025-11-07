"use client";

import * as React from "react";
import type { ChartTooltipContent as ChartTooltipContentComponent } from "@workspace/ui/components/chart";
import type { PaletteColor } from "@workspace/ui/lib/chart-palette";

type TooltipKeyEntry = {
  id: string;
  palette: PaletteColor;
  label?: string;
};

type TooltipFormatterOptions = {
  keys: TooltipKeyEntry[];
  formatValue: (value: number) => string;
  formatTotal?: (value: number) => string;
  totalLabel?: string;
  missingValueLabel?: string;
};

type ChartTooltipContentProps = React.ComponentProps<
  typeof ChartTooltipContentComponent
>;

type ValueFormatter = NonNullable<ChartTooltipContentProps["formatter"]>;
type LabelFormatter = NonNullable<ChartTooltipContentProps["labelFormatter"]>;

export function useChartTooltipFormatters({
  keys,
  formatValue,
  formatTotal = formatValue,
  totalLabel = "Totali",
  missingValueLabel = "Pa të dhëna",
}: TooltipFormatterOptions): {
  formatter: ValueFormatter;
  labelFormatter: LabelFormatter;
} {
  const keySet = React.useMemo(
    () => new Set(keys.map((entry) => entry.id)),
    [keys],
  );

  const paletteByKey = React.useMemo(
    () =>
      keys.reduce<Record<string, PaletteColor>>((acc, entry) => {
        acc[entry.id] = entry.palette;
        return acc;
      }, {}),
    [keys],
  );

  const labelFormatter = React.useCallback<LabelFormatter>(
    (rawLabel, payload) => {
      const items = Array.isArray(payload) ? payload : [];
      const relevantItems = items.filter(
        (item) => item && keySet.has(String(item.dataKey)),
      );

      if (relevantItems.length <= 1) {
        return rawLabel;
      }

      const total = relevantItems.reduce((sum, item) => {
        if (!item || !keySet.has(String(item.dataKey))) {
          return sum;
        }
        const nextValue =
          typeof item.value === "number" && Number.isFinite(item.value)
            ? item.value
            : null;
        return nextValue != null ? sum + nextValue : sum;
      }, 0);

      const formattedTotal = formatTotal(total);

      return (
        <div className="flex flex-col w-full items-center justify-between gap-2">
          <span>{rawLabel}</span>
          <span className="font-mono text-[0.7rem] font-semibold tracking-wide text-muted-foreground">
            {totalLabel ? `${totalLabel}: ${formattedTotal}` : formattedTotal}
          </span>
        </div>
      );
    },
    [formatTotal, keySet, totalLabel],
  );

  const formatter = React.useCallback<ValueFormatter>(
    (value, name, entry) => {
      const key =
        (entry?.dataKey && String(entry.dataKey)) ||
        (typeof name === "string" ? name : undefined);

      const numericValue =
        typeof value === "number"
          ? value
          : Array.isArray(value)
            ? Number(value[0])
            : typeof value === "string"
              ? Number(value)
              : NaN;

      const displayValue = Number.isFinite(numericValue)
        ? formatValue(numericValue as number)
        : missingValueLabel;

      const cssVarColor = key ? `var(--color-${key})` : undefined;

      const fallbackColor =
        (typeof entry?.color === "string" ? entry.color : undefined) ??
        (key
          ? (paletteByKey[key]?.light ?? paletteByKey[key]?.dark)
          : undefined) ??
        "var(--border)";

      const indicatorColor = cssVarColor ?? fallbackColor;

      return (
        <div className="flex w-full items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: indicatorColor }}
          />
          <div className="flex flex-1 items-center justify-between gap-2">
            <span className="text-foreground font-mono font-medium tabular-nums">
              {displayValue}
            </span>
          </div>
        </div>
      );
    },
    [formatValue, missingValueLabel, paletteByKey],
  );

  return { formatter, labelFormatter };
}
