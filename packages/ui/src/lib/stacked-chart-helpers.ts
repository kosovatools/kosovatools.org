import type { ChartConfig } from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";

export type StackedSeriesRow = {
  period: string;
  values: Record<string, number>;
};

export type StackChartRow = Record<string, number | string | null> & {
  period: string;
};

export type DatasetStackResult<TKey extends string> = {
  keys: Array<TKey | "Other">;
  labelMap: Record<TKey | "Other", string>;
  series: StackedSeriesRow[];
};

const DEFAULT_OTHER_KEY = "other" as const;

export type BuildStackedChartDataArgs = {
  otherKey?: string;
};

export function buildStackedChartData<TKey extends string>(
  stack: DatasetStackResult<TKey> | null,
  { otherKey = DEFAULT_OTHER_KEY }: BuildStackedChartDataArgs = {},
): {
  chartKeys: string[];
  chartData: StackChartRow[];
  chartConfig: ChartConfig;
} {
  if (!stack || !stack.keys.length || !stack.series.length) {
    return {
      chartKeys: [],
      chartData: [],
      chartConfig: {} as ChartConfig,
    };
  }

  type StackEntry = {
    stackKey: TKey | "Other";
    chartKey: string;
    label: string;
  };
  const entries: StackEntry[] = stack.keys.map((stackKey) => {
    const rawLabel =
      stackKey === "Other"
        ? (otherKey ?? "Other")
        : (stack.labelMap[stackKey] ?? (stackKey as string));
    const chartKey = String(stackKey);
    return { stackKey, chartKey, label: rawLabel };
  });

  const chartData: StackChartRow[] = stack.series.map((row) => {
    const base: StackChartRow = { period: row.period };
    for (const { stackKey, chartKey } of entries) {
      const value = row.values[stackKey];
      base[chartKey] =
        typeof value === "number" && Number.isFinite(value) ? value : null;
    }
    return base;
  });

  const themedConfig = addThemeToChartConfig(
    entries.reduce<ChartConfig>((acc, { stackKey, chartKey }) => {
      const label = stack.labelMap[stackKey] ?? chartKey;
      acc[chartKey] = { label };
      return acc;
    }, {} as ChartConfig),
  );

  return {
    chartKeys: entries.map((entry) => entry.chartKey),
    chartData,
    chartConfig: themedConfig,
  };
}
