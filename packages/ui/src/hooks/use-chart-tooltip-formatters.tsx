"use client";

import * as React from "react";
import type { ChartTooltipContent as ChartTooltipContentComponent } from "@workspace/ui/components/chart";
import type { PaletteColor } from "@workspace/ui/lib/chart-palette";

type TooltipKeyEntry = {
  id: string;
  palette: PaletteColor;
  label?: string;
  unit?: string | null;
};

type TooltipFormatterOptions = {
  keys: TooltipKeyEntry[] | Readonly<TooltipKeyEntry[]>;
  formatValue: (value: number) => string;
  formatTotal?: (value: number, unit?: string | null) => string;
  totalLabel?: string;
  missingValueLabel?: string;
  defaultUnit?: string | null;
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
  defaultUnit = null,
}: TooltipFormatterOptions): {
  formatter: ValueFormatter;
  labelFormatter: LabelFormatter;
} {
  const keySet = React.useMemo(
    () => new Set(keys.map((entry) => entry.id)),
    [keys],
  );

  const unitByKey = React.useMemo<Record<string, string | null>>(() => {
    const mapping: Record<string, string | null> = {};
    for (const entry of keys) {
      mapping[entry.id] = entry.unit ?? defaultUnit ?? null;
    }
    return mapping;
  }, [defaultUnit, keys]);

  const paletteByKey = React.useMemo<Record<string, PaletteColor>>(() => {
    const mapping: Record<string, PaletteColor> = {};
    for (const entry of keys) {
      mapping[entry.id] = entry.palette;
    }
    return mapping;
  }, [keys]);

  const labelFormatter = React.useCallback<LabelFormatter>(
    (rawLabel, payload) => {
      const relevantItems = payload.filter((item) =>
        keySet.has(String(item.dataKey)),
      );

      if (relevantItems.length <= 1) {
        return rawLabel;
      }

      const groupedTotals = relevantItems.reduce<
        Map<string | null, { total: number; count: number }>
      >((acc, item) => {
        const key = String(item.dataKey);
        const unitKey = unitByKey[key] ?? null;
        const entry = acc.get(unitKey) ?? { total: 0, count: 0 };
        const nextValue =
          typeof item.value === "number" && Number.isFinite(item.value)
            ? item.value
            : null;
        acc.set(unitKey, {
          total: entry.total + (nextValue ?? 0),
          count: entry.count + 1,
        });
        return acc;
      }, new Map<string | null, { total: number; count: number }>());

      const totalsToDisplay = Array.from(groupedTotals.entries())
        .map(([unit, info]) => ({ unit, ...info }))
        .filter((entry) => entry.count > 1);

      if (!totalsToDisplay.length) {
        return rawLabel;
      }

      return (
        <div className="flex flex-col w-full items-center justify-between gap-2">
          <span>{rawLabel}</span>
          {totalsToDisplay.map(({ unit, total }, index) => {
            const formattedTotal = formatTotal(total, unit);
            const labelParts = [
              totalLabel,
              typeof unit === "string" && unit.length ? `(${unit})` : null,
            ].filter(Boolean);
            const displayLabel = labelParts.join(" ");
            const text = displayLabel
              ? `${displayLabel}: ${formattedTotal}`
              : formattedTotal;

            return (
              <span
                key={unit ?? `unit-${index}`}
                className="font-mono text-[0.7rem] font-semibold tracking-wide text-muted-foreground"
              >
                {text}
              </span>
            );
          })}
        </div>
      );
    },
    [formatTotal, keySet, totalLabel, unitByKey],
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
        ? formatValue(numericValue)
        : missingValueLabel;

      const cssVarColor = key ? `var(--color-${key})` : undefined;

      const paletteColor: PaletteColor | undefined = key
        ? paletteByKey[key]
        : undefined;
      const fallbackColor =
        (typeof entry?.color === "string" ? entry.color : undefined) ??
        paletteColor?.light ??
        paletteColor?.dark ??
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
