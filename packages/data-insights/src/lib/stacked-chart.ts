import type { DatasetStackResult } from "@workspace/kas-data";
import type { ChartConfig } from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";

export type StackChartRow = Record<string, number | string | null> & {
  period: string;
};

type BuildStackedChartArgs = {
  otherKey?: string;
};

type BuiltStackedChart = {
  chartKeys: string[];
  chartData: StackChartRow[];
  chartConfig: ChartConfig;
};

const DEFAULT_OTHER_KEY = "other" as const;

export function buildStackedChartData<TKey extends string>(
  stack: DatasetStackResult<TKey> | null,
  { otherKey = DEFAULT_OTHER_KEY }: BuildStackedChartArgs = {},
): BuiltStackedChart {
  if (!stack || !stack.keys.length || !stack.series.length) {
    return {
      chartKeys: [],
      chartData: [],
      chartConfig: {} as ChartConfig,
    };
  }

  const entries = stack.keys.map((stackKey) => ({
    stackKey,
    chartKey: stackKey === "Other" ? otherKey : stackKey,
  }));

  const chartData: StackChartRow[] = stack.series.map((row) => {
    const base: StackChartRow = { period: row.period };
    entries.forEach(({ stackKey, chartKey }) => {
      const value = row.values[stackKey];
      base[chartKey] =
        typeof value === "number" && Number.isFinite(value) ? value : null;
    });
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
