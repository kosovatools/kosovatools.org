"use client";

import { useCallback, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import { AirTransportDatasetView } from "@workspace/kas-data";
import { formatCount } from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
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
  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
  } = useDeriveChartControls(dataset);

  const chartData = useMemo(() => {
    const baseRecords = datasetView.records;
    if (!baseRecords.length) return [];

    const aggregated = datasetView.aggregate({
      grouping: periodGrouping,
      fields: ["passengers_inbound", "passengers_outbound", "flights"],
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
          options={periodGroupingOptions}
        />
        <OptionSelector
          label="Periudha"
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
        />
      </div>
      <ChartContainer
        config={chartConfig}
        className="w-full aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart
          data={chartData}
          margin={COMMON_CHART_MARGINS}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={periodFormatter}
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            yAxisId="passengers"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => formatCount(value as number)}
            width="auto"
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
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
            yAxisId="passengers"
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
