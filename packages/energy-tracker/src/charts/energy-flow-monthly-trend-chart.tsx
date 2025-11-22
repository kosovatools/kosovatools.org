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

import type { EnergyMonthlyDatasetView } from "@workspace/dataset-api";
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
import { useDatasetTimeControls } from "@workspace/ui/lib/use-dataset-time-controls";

import { energyFlowChartConfig } from "../utils/chart-config";
import { formatAuto } from "../utils/number-format";

type TrendChartRow = {
  period: string;
  imports: number;
  exports: number;
  net: number;
};

export function MonthlyFlowTrendChart({
  dataset,
  timelineEvents,
}: {
  dataset: EnergyMonthlyDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const chartConfig = energyFlowChartConfig;
  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
  } = useDatasetTimeControls(dataset);

  const chartData = React.useMemo<TrendChartRow[]>(() => {
    const aggregated = datasetView.aggregate({
      grouping: periodGrouping,
      fields: [
        {
          key: "imports",
          valueAccessor: (record) => record.import ?? 0,
        },
        {
          key: "exports",
          valueAccessor: (record) => record.export ?? 0,
        },
        {
          key: "net",
          valueAccessor: (record) => record.net ?? 0,
        },
      ],
    });

    return aggregated.map((row) => ({
      period: row.period,
      imports: row.imports ?? 0,
      exports: row.exports ?? 0,
      net: row.net ?? 0,
    }));
  }, [datasetView, periodGrouping]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <OptionSelector
          label="Grupimi"
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={periodGroupingOptions}
        />
        <OptionSelector
          label="Intervali"
          value={timeRange}
          onChange={(value) => setTimeRange(value)}
          options={timeRangeOptions}
        />
      </div>
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <ComposedChart
          data={chartData}
          margin={COMMON_CHART_MARGINS}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickMargin={8}
            tickFormatter={(value) => periodFormatter(String(value))}
          />
          <YAxis
            width="auto"
            tickFormatter={(value: number | string) =>
              formatAuto(value, { includeUnit: true })
            }
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) =>
              formatAuto(value as number | string | null | undefined, {
                includeUnit: true,
              })
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            dataKey="imports"
            type="monotone"
            fill="var(--color-imports)"
            fillOpacity={0.2}
            stroke="var(--color-imports)"
            strokeWidth={2}
          />
          <Area
            dataKey="exports"
            type="monotone"
            fill="var(--color-exports)"
            fillOpacity={0.15}
            stroke="var(--color-exports)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="var(--color-net)"
            strokeWidth={3}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
