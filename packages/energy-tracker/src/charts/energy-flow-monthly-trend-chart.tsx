"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import type { DatasetView, EnergyMonthlyDataset } from "@workspace/data";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import type { ChartConfig } from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";
import {
  createChromaPalette,
  resolvePaletteColor,
} from "@workspace/ui/lib/chart-palette";

import { energyFlowChartConfig } from "../utils/chart-config";
import { formatAuto } from "../utils/number-format";

type TrendChartRow = {
  period: string;
  net: number;
  [key: string]: number | string;
};

export function MonthlyFlowTrendChart({
  dataset,
  timelineEvents,
}: {
  dataset: DatasetView<EnergyMonthlyDataset>;
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
  } = useDeriveChartControls(dataset, {
    includeSeasonal: true,
    initialGrouping: "quarterly",
  });

  const neighborPalette = React.useMemo(() => createChromaPalette(6), []);
  const neighborLabelMap = React.useMemo(() => {
    const options = dataset.meta.dimensions?.neighbor ?? [];
    return Object.fromEntries(
      options.map((option) => [option.key, option.label]),
    );
  }, [dataset.meta.dimensions]);

  const netStack = React.useMemo(
    () =>
      datasetView.viewAsStack({
        dimension: "neighbor",
        valueAccessor: (record) => record.net ?? 0,
        periodGrouping,
      }),
    [datasetView, periodGrouping],
  );

  const neighborKeys = netStack.keys;

  const chartConfig = React.useMemo<ChartConfig>(() => {
    const baseConfig: ChartConfig = {
      net: energyFlowChartConfig.net,
    };

    neighborKeys.forEach((key, index) => {
      const theme = resolvePaletteColor(neighborPalette, index);
      const label = neighborLabelMap[key] ?? key;
      baseConfig[`net-${key}`] = {
        label: `Bilanci neto · ${label}`,
        theme,
      };
    });

    return baseConfig;
  }, [neighborKeys, neighborLabelMap, neighborPalette]);

  const chartData = React.useMemo<TrendChartRow[]>(() => {
    return netStack.series.map((row) => {
      const values = row.values ?? {};
      const netTotal = Object.values(values).reduce(
        (sum, value) => sum + (typeof value === "number" ? value : 0),
        0,
      );

      const dataRow: TrendChartRow = {
        period: row.period,
        net: netTotal,
      };

      neighborKeys.forEach((key) => {
        const value = values[key];
        dataRow[`net-${key}`] =
          typeof value === "number" && Number.isFinite(value) ? value : 0;
      });

      return dataRow;
    });
  }, [netStack.series, neighborKeys]);

  return (
    <ChartScaffolding
      actions={
        <>
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
        </>
      }
    >
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <ComposedChart
          data={chartData}
          margin={COMMON_CHART_MARGINS}
          stackOffset="sign"
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
            {...timelineEvents}
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
          <ReferenceLine y={0} stroke="var(--muted-foreground)" />
          {neighborKeys.map((key) => (
            <Bar
              key={`net-${key}`}
              isAnimationActive={false}
              dataKey={`net-${key}`}
              stackId="net"
              fill={`var(--color-net-${key})`}
              stroke={`var(--color-net-${key})`}
              radius={3}
              maxBarSize={24}
            />
          ))}
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="net"
            stroke="var(--color-net)"
            strokeWidth={3}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
