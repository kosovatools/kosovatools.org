import * as React from "react";
import { ChartTooltipContent } from "@workspace/ui/components/chart";
import {
  createChromaPalette,
  resolvePaletteColor,
} from "@workspace/ui/lib/chart-palette";
import { formatCurrency } from "@workspace/utils";

const PIE_FALLBACK_COLOR = "hsl(var(--primary))";

export type SliceColor = {
  fill: string;
  stroke: string;
};

export type PieLegendSlice = {
  turnover: number;
  fill: string;
};

export type TooltipFormatter = NonNullable<
  React.ComponentProps<typeof ChartTooltipContent>["formatter"]
>;

export function buildColoredSlices<T extends { turnover: number }>(
  records: T[],
): Array<T & SliceColor> {
  if (!records.length) {
    return [];
  }

  const palette = createChromaPalette(records.length);

  return records.map((record, index) => {
    const paletteColor = resolvePaletteColor(palette, index);
    const fill = paletteColor.light || PIE_FALLBACK_COLOR;
    const stroke =
      paletteColor.dark || paletteColor.light || PIE_FALLBACK_COLOR;
    return {
      ...record,
      fill,
      stroke,
    };
  });
}

export function usePieTooltipFormatter<T extends SliceColor>({
  getLabel,
}: {
  getLabel: (slice?: T, fallbackName?: string) => string;
}): TooltipFormatter {
  return React.useCallback<TooltipFormatter>(
    (value, name, entry) => {
      const slice = entry?.payload as T | undefined;
      const color =
        slice?.fill ??
        (typeof entry?.color === "string" ? entry.color : undefined) ??
        PIE_FALLBACK_COLOR;

      const fallbackName =
        typeof name === "string" || typeof name === "number"
          ? String(name)
          : undefined;

      const label = getLabel(slice, fallbackName) ?? "";
      const numericValue =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value)
            : null;
      const formattedValue = formatCurrency(numericValue);

      return (
        <div className="flex w-full items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
          <div className="flex flex-1 items-center justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-mono font-medium tabular-nums">
              {formattedValue}
            </span>
          </div>
        </div>
      );
    },
    [getLabel],
  );
}
export function PieLegendList<T extends PieLegendSlice>({
  slices,
  getLabel,
}: {
  slices: T[];
  getLabel: (slice: T) => string;
}) {
  if (!slices.length) {
    return null;
  }

  return (
    <div className="flex flex-col justify-stretch gap-2 pt-4 text-xs">
      {slices.map((slice, index) => {
        const label = getLabel(slice);
        return (
          <div
            key={`${label}-${index}`}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: slice.fill }}
              />
              <span className="font-medium leading-none">{label}</span>
            </div>
            <span className="font-mono text-muted-foreground">
              {formatCurrency(slice.turnover)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
