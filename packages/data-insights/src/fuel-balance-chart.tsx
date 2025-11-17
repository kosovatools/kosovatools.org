"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { fuelDataset, FuelDatasetMeta } from "@workspace/kas-data";
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
import {
  OptionSelector,
  type SelectorOptionDefinition,
} from "@workspace/ui/custom-components/option-selector";
import { useTimelineEventMarkers } from "@workspace/timeline-events";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
type FuelMetric = FuelDatasetMeta["metrics"][number];

const CHART_CLASS = "w-full aspect-[4/3] sm:aspect-video";
const CHART_MARGIN = { top: 32, right: 32, bottom: 16, left: 16 };

const PERIOD_GROUPING_OPTIONS: ReadonlyArray<PeriodGroupingOption> =
  getPeriodGroupingOptions(fuelDataset.meta.time.granularity);
const TIME_RANGE_OPTIONS = limitTimeRangeOptions(fuelDataset.meta.time);
const DEFAULT_TIME_RANGE: TimeRangeOption = 24;

const METRIC_OPTIONS: ReadonlyArray<SelectorOptionDefinition<FuelMetric>> =
  fuelDataset.meta.fields;

export function FuelBalanceChart() {
  const [metricKey, setMetricKey] = React.useState<FuelMetric>("import");
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    fuelDataset.meta.time.granularity,
  );
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const datasetView = React.useMemo(
    () => fuelDataset.limit(timeRange),
    [timeRange],
  );

  const stackResult = React.useMemo(() => {
    if (!datasetView.records.length) {
      return null;
    }

    return datasetView.viewAsStack({
      keyAccessor: (record) => record.fuel,
      valueAccessor: (record) => record[metricKey],
      dimension: "fuel",
      periodGrouping,
    });
  }, [datasetView, metricKey, periodGrouping]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  const eventMarkers = useTimelineEventMarkers(chartData, periodGrouping);

  if (!chartData.length || !chartKeys.length) {
    return (
      <ChartContainer config={{}} className={CHART_CLASS}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për karburantet.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OptionSelector<FuelMetric>
          value={metricKey}
          onChange={(value) => setMetricKey(value)}
          options={METRIC_OPTIONS}
          label="Metrika"
        />
        <OptionSelector<PeriodGrouping>
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={PERIOD_GROUPING_OPTIONS}
          label="Perioda"
        />
        <OptionSelector<TimeRangeOption>
          value={timeRange}
          onChange={setTimeRange}
          options={TIME_RANGE_OPTIONS}
          label="Intervali"
        />
      </div>
      <ChartContainer config={chartConfig} className={CHART_CLASS}>
        <AreaChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickFormatter={(value) => periodFormatter(String(value))}
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={(value) => `${formatCount(value as number)} tonë`}
            axisLine={false}
          />
          {eventMarkers.map((event) => (
            <ReferenceLine
              key={event.id}
              x={event.x}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
            >
              <Label
                value={event.label}
                position="top"
                fill="var(--muted-foreground)"
                fontSize={10}
                offset={event.offset}
              />
            </ReferenceLine>
          ))}
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => {
            const label = chartConfig[key]?.label;
            const seriesName = typeof label === "string" ? label : key;

            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="fuel"
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.85}
                name={seriesName}
              />
            );
          })}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
