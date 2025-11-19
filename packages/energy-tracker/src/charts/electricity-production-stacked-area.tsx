"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { electricityDataset, createLabelMap } from "@workspace/kas-data";
import {
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  sanitizeValue,
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
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { useTimelineEventMarkers } from "@workspace/timeline-events";

import { formatAuto } from "../utils/number-format";

type ElectricityDatasetView = typeof electricityDataset;

export function ElectricityProductionStackedAreaChart({
  dataset,
}: {
  dataset: ElectricityDatasetView;
}) {
  const labelMap = createLabelMap(dataset.meta.fields);
  const PERIOD_GROUPING_OPTIONS = getPeriodGroupingOptions(
    dataset.meta.time.granularity,
  );
  const TIME_RANGE_OPTIONS = limitTimeRangeOptions(dataset.meta.time);
  const DEFAULT_TIME_RANGE = 24;

  const chartConfig = addThemeToChartConfig({
    production_thermal_gwh: { label: labelMap.production_thermal_gwh },
    production_hydro_gwh: { label: labelMap.production_hydro_gwh },
    production_wind_solar_gwh: { label: labelMap.production_wind_solar_gwh },
  });

  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";
  const chartMargin = { top: 24, right: 0, left: 0, bottom: 0 };
  const [periodGrouping, setPeriodGrouping] = useState<PeriodGrouping>(
    dataset.meta.time.granularity,
  );
  const [timeRange, setTimeRange] =
    useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const datasetView = useMemo(
    () => dataset.limit(timeRange),
    [dataset, timeRange],
  );
  const periodFormatter = useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  const chartData = useMemo(() => {
    if (!datasetView.records.length) return [];
    const aggregated = datasetView.aggregate<
      | "production_thermal_gwh"
      | "production_hydro_gwh"
      | "production_wind_solar_gwh"
    >({
      grouping: periodGrouping,
      fields: [
        {
          key: "production_thermal_gwh",
          valueAccessor: (record) =>
            sanitizeValue(record.production_thermal_gwh, 0),
        },
        {
          key: "production_hydro_gwh",
          valueAccessor: (record) =>
            sanitizeValue(record.production_hydro_gwh, 0),
        },
        {
          key: "production_wind_solar_gwh",
          valueAccessor: (record) =>
            sanitizeValue(record.production_wind_solar_gwh, 0),
        },
      ],
    });

    const sortedAggregated = [...aggregated].sort((a, b) =>
      a.period.localeCompare(b.period),
    );

    return sortedAggregated.map((row) => ({
      period: row.period,
      periodLabel: periodFormatter(row.period),
      production_thermal_gwh: row.production_thermal_gwh ?? null,
      production_hydro_gwh: row.production_hydro_gwh ?? null,
      production_wind_solar_gwh: row.production_wind_solar_gwh ?? null,
    }));
  }, [datasetView, periodGrouping, periodFormatter]);

  const eventMarkers = useTimelineEventMarkers(chartData, periodGrouping);

  return chartData.length ? (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OptionSelector
          label="Perioda"
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={PERIOD_GROUPING_OPTIONS}
        />
        <OptionSelector
          label="Intervali"
          value={timeRange}
          onChange={setTimeRange}
          options={TIME_RANGE_OPTIONS}
        />
      </div>
      <ChartContainer config={chartConfig} className={chartClassName}>
        <AreaChart data={chartData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={(value) =>
              formatAuto(Number(value), { inputUnit: "MWh" })
            }
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
          <ChartTooltip
            content={
              <ChartTooltipContent
                valueFormatter={(value) =>
                  formatAuto(Number(value), { inputUnit: "MWh" })
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="production_thermal_gwh"
            stackId="production"
            stroke="var(--color-production_thermal_gwh)"
            fill="var(--color-production_thermal_gwh)"
            fillOpacity={0.2}
            name={chartConfig.production_thermal_gwh.label}
          />
          <Area
            type="monotone"
            dataKey="production_hydro_gwh"
            stackId="production"
            stroke="var(--color-production_hydro_gwh)"
            fill="var(--color-production_hydro_gwh)"
            fillOpacity={0.2}
            name={chartConfig.production_hydro_gwh.label}
          />
          <Area
            type="monotone"
            dataKey="production_wind_solar_gwh"
            stackId="production"
            stroke="var(--color-production_wind_solar_gwh)"
            fill="var(--color-production_wind_solar_gwh)"
            fillOpacity={0.2}
            name={chartConfig.production_wind_solar_gwh.label}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  ) : (
    <ChartContainer config={chartConfig} className={chartClassName}>
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Nuk ka të dhëna për prodhimin.
      </div>
    </ChartContainer>
  );
}
