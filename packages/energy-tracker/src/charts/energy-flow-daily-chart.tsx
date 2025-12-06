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

import type { DatasetView, EnergyDailyDataset } from "@workspace/data";
import { formatDayLabel } from "../date-formatters";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { energyFlowChartConfig } from "../utils/chart-config";
import { formatAuto } from "../utils/number-format";
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";
import {
  createChromaPalette,
  resolvePaletteColor,
} from "@workspace/ui/lib/chart-palette";

type DailyChartRow = Record<string, number | string> & {
  period: string;
  label: string;
  net: number;
};

export function DailyFlowChart({
  dataset,
  timelineEvents,
}: {
  dataset: DatasetView<EnergyDailyDataset>;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const neighborPalette = React.useMemo(() => createChromaPalette(6), []);
  const neighborLabelMap = React.useMemo(() => {
    const options = dataset.meta.dimensions?.neighbor ?? [];
    return Object.fromEntries(
      options.map((option) => [option.key, option.label]),
    );
  }, [dataset.meta.dimensions]);

  const netStack = React.useMemo(
    () =>
      dataset.viewAsStack({
        dimension: "neighbor",
        valueAccessor: (record) => record.net ?? 0,
      }),
    [dataset],
  );

  const neighborKeys = netStack.keys;

  const periods = React.useMemo(
    () => dataset.periods({ grouping: dataset.meta.time.granularity }),
    [dataset],
  );

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

  const netByPeriod = React.useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    netStack.series.forEach((row) => map.set(row.period, row.values));
    return map;
  }, [netStack.series]);

  const netTotalsByPeriod = React.useMemo(() => {
    const map = new Map<string, number>();
    netStack.series.forEach((row) => {
      const total = Object.values(row.values ?? {}).reduce(
        (sum, value) => sum + (typeof value === "number" ? value : 0),
        0,
      );
      map.set(row.period, total);
    });
    return map;
  }, [netStack.series]);

  const chartData = React.useMemo<DailyChartRow[]>(() => {
    return periods.map((period) => {
      const netByNeighbor = netByPeriod.get(period) ?? {};

      const row: DailyChartRow = {
        period,
        label: formatDayLabel(period),
        net: netTotalsByPeriod.get(period) ?? 0,
      };

      neighborKeys.forEach((key) => {
        const netValue = netByNeighbor[key];
        row[`net-${key}`] =
          typeof netValue === "number" && Number.isFinite(netValue)
            ? netValue
            : 0;
      });

      return row;
    });
  }, [
    periods,
    netByPeriod,
    netTotalsByPeriod,
    neighborKeys,
  ]);

  return (
    <ChartScaffolding>
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
            labelFormatter={(value) => formatDayLabel(String(value))}
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
            dataKey="net"
            type="monotone"
            stroke="var(--color-net)"
            strokeWidth={3}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
