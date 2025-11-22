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

import { FuelDatasetView } from "@workspace/kas-data";
import { formatCount } from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
const CHART_CLASS = "w-full aspect-[1/1.5] sm:aspect-video";

export function FuelBalanceChart({
  dataset,
  timelineEvents,
}: {
  dataset: FuelDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
    metric,
    setMetric,
    metricOptions,
  } = useDeriveChartControls(dataset);

  const stackResult = React.useMemo(() => {
    return datasetView.viewAsStack({
      valueAccessor: (record) => record[metric],
      dimension: "fuel",
      periodGrouping,
    });
  }, [datasetView, metric, periodGrouping]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OptionSelector
          value={metric}
          onChange={(value) => setMetric(value)}
          options={metricOptions}
          label="Metrika"
        />
        <OptionSelector
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={periodGroupingOptions}
          label="Perioda"
        />
        <OptionSelector
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
          label="Intervali"
        />
      </div>
      <ChartContainer config={chartConfig} className={CHART_CLASS}>
        <AreaChart data={chartData} margin={COMMON_CHART_MARGINS}>
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
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            {...timelineEvents}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) =>
              `${formatCount(value as number | null)} tonë`
            }
          />
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
                fillOpacity={0.2}
                name={seriesName}
              />
            );
          })}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
