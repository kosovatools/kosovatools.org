"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { type EmploymentActivityGenderDatasetView } from "@workspace/kas-data";
import {
  formatCount,
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
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

const CHART_MARGIN = { top: 24, right: 16, bottom: 16, left: 16 };

export function EmploymentActivityChart({
  dataset,
  top = 8,
}: {
  dataset: EmploymentActivityGenderDatasetView;
  top?: number;
}) {
  const periodOptions: ReadonlyArray<PeriodGroupingOption> =
    getPeriodGroupingOptions(dataset.meta.time.granularity);
  const timeRangeOptions = limitTimeRangeOptions(dataset.meta.time);
  const DEFAULT_TIME_RANGE: TimeRangeOption =
    timeRangeOptions.find((option) => typeof option.key === "number")?.key ??
    null;

  const [gender, setGender] =
    React.useState<
      EmploymentActivityGenderDatasetView["meta"]["dimensions"]["gender"][number]["key"]
    >("total");
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
      keyAccessor: (record) => record.activity,
      valueAccessor: (record) =>
        record.gender === gender ? record.employment : null,
      dimension: "activity",
      periodGrouping,
      groupedValueMode: "latest",
      dropIncompletePeriods: true,
      preserveLatestIncomplete: true,
      includeOther: true,
      top,
    });
  }, [datasetView, gender, periodGrouping, top]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () =>
      buildStackedChartData(stackResult, {
        otherKey: "Të tjerët",
      }),
    [stackResult],
  );

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <OptionSelector
          value={gender}
          onChange={(value) => setGender(value)}
          options={dataset.meta.dimensions.gender}
          label="Gjinia"
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
        <AreaChart data={chartData} margin={CHART_MARGIN}>
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
            tickFormatter={(value) => `${formatCount(value as number)} persona`}
            axisLine={false}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                valueFormatter={(value) =>
                  `${formatCount(value as number)} persona`
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="employment-activity"
              stroke={`var(--color-${key})`}
              fill={`var(--color-${key})`}
              fillOpacity={0.2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
