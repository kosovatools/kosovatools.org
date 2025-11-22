"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { electricityDataset, createLabelMap } from "@workspace/kas-data";
import { sanitizeValue } from "@workspace/utils";
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
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";

import { formatAuto } from "../utils/number-format";

type ElectricityDatasetView = typeof electricityDataset;

export function ElectricityProductionStackedAreaChart({
  dataset,
  timelineEvents,
}: {
  dataset: ElectricityDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const labelMap = createLabelMap(dataset.meta.fields);

  const chartConfig = addThemeToChartConfig({
    production_thermal_gwh: { label: labelMap.production_thermal_gwh },
    production_hydro_gwh: { label: labelMap.production_hydro_gwh },
    production_wind_solar_gwh: { label: labelMap.production_wind_solar_gwh },
  });

  const chartClassName = "w-full aspect-[1/1.5] sm:aspect-video";

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
  });

  const chartData = useMemo(() => {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OptionSelector
          label="Perioda"
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={periodGroupingOptions}
        />
        <OptionSelector
          label="Intervali"
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
        />
      </div>
      <ChartContainer config={chartConfig} className={chartClassName}>
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
            tickFormatter={(value) =>
              formatAuto(value as number | string | null | undefined, {
                inputUnit: "MWh",
              })
            }
            axisLine={false}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            {...timelineEvents}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            valueFormatter={(value) =>
              formatAuto(value as number | string | null | undefined, {
                inputUnit: "MWh",
              })
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
  );
}
