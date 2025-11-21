"use client";

import { useCallback, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import { AirTransportDatasetView } from "@workspace/kas-data";
import {
  formatCount,
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodGrouping,
  type TimeRangeOption,
} from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";

const baseChartConfig = {
  passengers_inbound: {
    label: "Pasagjerë hyrës",
  },
  passengers_outbound: {
    label: "Pasagjerë dalës",
  },
  flights: {
    label: "Fluturime",
  },
} as const;

const chartConfig = addThemeToChartConfig(baseChartConfig);

export function AviationStatsChart({
  dataset,
  timelineEvents,
}: {
  dataset: AirTransportDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const PERIOD_GROUPING_OPTIONS = getPeriodGroupingOptions(
    dataset.meta.time.granularity,
  );
  const TIME_RANGE_OPTIONS = limitTimeRangeOptions(dataset.meta.time);
  const [periodGrouping, setPeriodGrouping] =
    useState<PeriodGrouping>("yearly");
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(null);

  const datasetView = useMemo(() => {
    if (timeRange == null || Number.isNaN(timeRange)) {
      return dataset;
    }
    return dataset.limit(timeRange);
  }, [dataset, timeRange]);

  const periodFormatter = useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  const formatPeriodTick = useCallback(
    (value: string | number) =>
      periodFormatter(typeof value === "string" ? value : String(value)),
    [periodFormatter],
  );

  const chartData = useMemo(() => {
    const baseRecords = datasetView.records;
    if (!baseRecords.length) return [];

    const aggregated = datasetView.aggregate({
      grouping: periodGrouping,
      fields: [
        {
          key: "passengers_inbound",
          valueAccessor: (record) => record.passengers_inbound,
        },
        {
          key: "passengers_outbound",
          valueAccessor: (record) => record.passengers_outbound,
        },
        {
          key: "flights",
          valueAccessor: (record) => record.flights,
        },
      ],
    });

    return aggregated;
  }, [datasetView, periodGrouping]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <OptionSelector
          label="Grupimi"
          value={periodGrouping}
          onChange={setPeriodGrouping}
          options={PERIOD_GROUPING_OPTIONS}
        />
        <OptionSelector
          label="Periudha"
          value={timeRange}
          onChange={setTimeRange}
          options={TIME_RANGE_OPTIONS}
        />
      </div>
      <ChartContainer
        config={chartConfig}
        className="w-full aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 0,
            right: 0,
            top: 10,
            bottom: 0,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={formatPeriodTick}
            minTickGap={30}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => formatCount(value as number)}
            width="auto"
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
          <YAxis
            yAxisId="flights"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => formatCount(value as number)}
            width="auto"
          />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) => formatCount(value as number | null)}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="passengers_inbound"
            yAxisId="passengers"
            stackId="passengers"
            stroke="var(--color-passengers_inbound)"
            fill="var(--color-passengers_inbound)"
            fillOpacity={0.2}
          />
          <Area
            type="monotone"
            dataKey="passengers_outbound"
            yAxisId="passengers"
            stackId="passengers"
            stroke="var(--color-passengers_outbound)"
            fill="var(--color-passengers_outbound)"
            fillOpacity={0.2}
            isAnimationActive={false}
            name={chartConfig.passengers_outbound.label}
          />
          <Line
            type="monotone"
            dataKey="flights"
            yAxisId="flights"
            stroke="var(--color-flights)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name={chartConfig.flights.label}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
