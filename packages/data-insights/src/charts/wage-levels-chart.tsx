"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { type WageLevelsDatasetView } from "@workspace/kas-data";
import {
  formatCurrencyCompact,
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodGrouping,
  type PeriodGroupingOption,
  type TimeRangeOption,
} from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

const CHART_MARGIN = { top: 24, right: 16, bottom: 16, left: 16 };

export function WageLevelsChart({
  dataset,
}: {
  dataset: WageLevelsDatasetView;
}) {
  const periodOptions: ReadonlyArray<PeriodGroupingOption> =
    getPeriodGroupingOptions(dataset.meta.time.granularity);
  const timeRangeOptions = limitTimeRangeOptions(dataset.meta.time);
  const DEFAULT_TIME_RANGE: TimeRangeOption =
    timeRangeOptions.find((option) => option.key === 10)?.key ?? null;

  const [metric, setMetric] =
    React.useState<WageLevelsDatasetView["meta"]["metrics"][number]>(
      "gross_eur",
    );
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    dataset.meta.time.granularity,
  );
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const datasetView = React.useMemo(
    () => dataset.limit(timeRange),
    [dataset, timeRange],
  );

  const stackResult = React.useMemo(() => {
    if (!datasetView.records.length) return null;
    return datasetView.viewAsStack({
      keyAccessor: (record) => record.group,
      valueAccessor: (record) => record[metric],
      dimension: "group",
      periodGrouping,
      includeOther: false,
    });
  }, [datasetView, metric, periodGrouping]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap  justify-between items-center gap-3">
        <OptionSelector
          value={metric}
          onChange={(value) => setMetric(value)}
          options={dataset.meta.fields}
          label="Metrika"
        />
        <OptionSelector
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={periodOptions}
          label="Perioda"
        />
        <OptionSelector
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
          label="Intervali"
        />
      </div>
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <LineChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickFormatter={(value) => periodFormatter(String(value))}
            tickMargin={8}
            minTickGap={20}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={(value) => formatCurrencyCompact(value as number)}
            axisLine={false}
          />
          <ChartTooltip
            valueFormatter={(value) =>
              formatCurrencyCompact(value as number | null)
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
