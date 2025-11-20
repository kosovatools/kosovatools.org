"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import type { EnergyDailyDatasetView } from "@workspace/dataset-api";
import { formatDayLabel } from "../date-formatters";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { energyFlowChartConfig } from "../utils/chart-config";
import { formatAuto } from "../utils/number-format";

type DailyChartRow = {
  period: string;
  date: string;
  label: string;
  imports: number;
  exports: number;
  net: number;
};

export function DailyFlowChart({
  dataset,
  timelineEvents,
}: {
  dataset: EnergyDailyDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const chartConfig = energyFlowChartConfig;

  const chartData = React.useMemo<DailyChartRow[]>(() => {
    return dataset.records.map((record) => ({
      period: record.period,
      date: record.period,
      label: formatDayLabel(record.period),
      imports: record.import ?? 0,
      exports: record.export ?? 0,
      net: record.net ?? 0,
    }));
  }, [dataset.records]);

  if (!chartData.length) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna ditore për të shfaqur.
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[1/1.5] sm:aspect-video"
    >
      <ComposedChart
        data={chartData}
        margin={{ top: 16, right: 0, bottom: 12, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="period"
          tickMargin={8}
          tickFormatter={(value) => formatDayLabel(String(value))}
        />
        <YAxis
          width="auto"
          tickFormatter={(value: number | string) =>
            formatAuto(value, { includeUnit: true })
          }
        />
        <TimelineEventMarkers
          data={chartData}
          grouping={dataset.meta.time.granularity}
          enabled={timelineEvents?.enabled}
          includeCategories={timelineEvents?.includeCategories}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              valueFormatter={(value) =>
                formatAuto(value as number, { includeUnit: true })
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="imports"
          type="monotone"
          fill="var(--color-imports)"
          fillOpacity={0.15}
          stroke="var(--color-imports)"
          strokeWidth={2}
        />
        <Area
          dataKey="exports"
          type="monotone"
          fill="var(--color-exports)"
          fillOpacity={0.12}
          stroke="var(--color-exports)"
          strokeWidth={2}
        />
        <Line
          dataKey="net"
          type="monotone"
          stroke="var(--color-net)"
          strokeWidth={3}
          dot={{ r: 2 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
