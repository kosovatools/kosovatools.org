import type { ChartConfig } from "@workspace/ui/components/chart";
import {
  createChromaPalette,
  resolvePaletteColor,
  type PaletteColor,
} from "@workspace/ui/lib/chart-palette";

export type StackedSeriesRow = {
  period: string;
  values: Record<string, number>;
};

export type StackedKeyEntry = {
  id: string;
  originalKey: string;
  label: string;
  palette: PaletteColor;
};

export type BuildStackedChartViewArgs = {
  keys: string[];
  labelMap: Record<string, string>;
  series: StackedSeriesRow[];
  periodFormatter: (period: string) => string;
};

export type StackedChartView = {
  keyMap: StackedKeyEntry[];
  config: ChartConfig;
  chartData: Array<Record<string, string | number>>;
};

function toKeyId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length ? slug : `series-${index}`;
}

export function buildStackedChartView({
  keys,
  labelMap,
  series,
  periodFormatter,
}: BuildStackedChartViewArgs): StackedChartView {
  if (!keys.length || !series.length) {
    return { keyMap: [], config: {} as ChartConfig, chartData: [] };
  }

  const dynamicKeys = keys.filter((key) => key !== "Other");
  const palette = createChromaPalette(dynamicKeys.length);
  let paletteIndex = 0;

  const keyMap = keys.map((key, index) => {
    const label = labelMap[key] ?? key;
    let paletteEntry: PaletteColor;
    if (key === "Other") {
      paletteEntry = {
        light: "var(--muted-foreground)",
        dark: "var(--muted-foreground)",
      };
    } else {
      paletteEntry = resolvePaletteColor(palette, paletteIndex);
      paletteIndex += 1;
    }

    return {
      id: toKeyId(label, index),
      originalKey: key,
      label,
      palette: paletteEntry,
    };
  });

  const config = keyMap.reduce<ChartConfig>((acc, entry) => {
    acc[entry.id] = {
      label: entry.label,
      theme: {
        light: entry.palette.light,
        dark: entry.palette.dark,
      },
    };
    return acc;
  }, {});

  const chartData = series.map((row) => {
    const base: Record<string, string | number> = {
      period: row.period,
      periodLabel: periodFormatter(row.period),
    };
    for (const entry of keyMap) {
      base[entry.id] = row.values[entry.originalKey] ?? 0;
    }
    return base;
  });

  return { keyMap, config, chartData };
}
