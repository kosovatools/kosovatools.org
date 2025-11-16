"use client";

import { useCallback, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import { airTransportMonthly } from "@workspace/kas-data";
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
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";

const PERIOD_GROUPING_OPTIONS = getPeriodGroupingOptions(
  airTransportMonthly.meta.time.granularity,
);
const TIME_RANGE_OPTIONS = limitTimeRangeOptions(airTransportMonthly.meta.time);

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

export function AviationStatsChart() {
  const [periodGrouping, setPeriodGrouping] = useState<PeriodGrouping>(
    airTransportMonthly.meta.time.granularity,
  );
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(24);

  const datasetView = useMemo(() => {
    if (timeRange == null || Number.isNaN(timeRange)) {
      return airTransportMonthly;
    }
    return airTransportMonthly.limit(timeRange);
  }, [timeRange]);

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

  if (!chartData.length) {
    return (
      <ChartContainer config={chartConfig} className="h-[360px] w-full">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për t'u shfaqur.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <OptionSelector<PeriodGrouping>
          label="Grupimi"
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={PERIOD_GROUPING_OPTIONS}
        />
        <OptionSelector<TimeRangeOption>
          label="Intervali"
          value={timeRange}
          onChange={(value) => setTimeRange(value)}
          options={TIME_RANGE_OPTIONS}
        />
      </div>
      <ChartContainer config={chartConfig} className="h-[420px] w-full">
        <AreaChart
          data={chartData}
          margin={{ top: 32, right: 32, bottom: 16, left: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriodTick}
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            yAxisId="passengers"
            width="auto"
            tickFormatter={(value) => formatCount(value as number)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="flights"
            orientation="right"
            width="auto"
            tickFormatter={(value) => formatCount(value as number)}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => formatPeriodTick(value as string)}
              />
            }
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
            isAnimationActive={false}
            name={chartConfig.passengers_inbound.label}
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
