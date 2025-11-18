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

import type { EnergyMonthlyDatasetView } from "../types";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodGrouping,
  type PeriodGroupingOption,
  type TimeRangeOption,
} from "@workspace/utils";

import { energyFlowChartConfig } from "../utils/chart-config";
import { formatAuto } from "../utils/number-format";

type TrendChartRow = {
  period: string;
  label: string;
  imports: number;
  exports: number;
  net: number;
};

export function MonthlyFlowTrendChart({
  dataset,
}: {
  dataset: EnergyMonthlyDatasetView;
}) {
  const chartConfig = energyFlowChartConfig;
  const periodGroupingOptions = React.useMemo<
    ReadonlyArray<PeriodGroupingOption>
  >(
    () => getPeriodGroupingOptions(dataset.meta.time.granularity),
    [dataset.meta.time.granularity],
  );
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    dataset.meta.time.granularity,
  );
  const timeRangeOptions = React.useMemo(
    () => limitTimeRangeOptions(dataset.meta.time),
    [dataset.meta.time],
  );
  const [timeRange, setTimeRange] = React.useState<TimeRangeOption>(
    () => timeRangeOptions[0]?.key ?? null,
  );

  const limitedDataset = React.useMemo(
    () => dataset.limit(timeRange ?? null),
    [dataset, timeRange],
  );

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  const chartData = React.useMemo<TrendChartRow[]>(() => {
    const aggregated = limitedDataset.aggregate({
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
      label: periodFormatter(row.period),
      imports: row.imports ?? 0,
      exports: row.exports ?? 0,
      net: row.net ?? 0,
    }));
  }, [limitedDataset, periodGrouping, periodFormatter]);

  if (!chartData.length) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka ende të dhëna mujore.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <OptionSelector<PeriodGrouping>
          label="Grupimi"
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={periodGroupingOptions}
        />
        <OptionSelector<TimeRangeOption>
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
          margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tickMargin={8} />
          <YAxis
            width="auto"
            tickFormatter={(value: number | string) =>
              formatAuto(value, { includeUnit: true })
            }
          />
          <ChartTooltip content={<ChartTooltipContent />} />
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
