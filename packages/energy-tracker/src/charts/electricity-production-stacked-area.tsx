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

import {
  createLabelMap,
  type DatasetView,
  type ElectricityDataset,
} from "@workspace/data";
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
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";

import { formatAuto } from "../utils/number-format";

export function ElectricityProductionStackedAreaChart({
  dataset,
  timelineEvents,
}: {
  dataset: DatasetView<ElectricityDataset>;
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
    <ChartScaffolding
      actions={
        <>
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
        </>
      }
    >
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
            isAnimationActive={false}
            type="monotone"
            dataKey="production_thermal_gwh"
            stackId="production"
            stroke="var(--color-production_thermal_gwh)"
            fill="var(--color-production_thermal_gwh)"
            fillOpacity={0.2}
            name={chartConfig.production_thermal_gwh.label}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="production_hydro_gwh"
            stackId="production"
            stroke="var(--color-production_hydro_gwh)"
            fill="var(--color-production_hydro_gwh)"
            fillOpacity={0.2}
            name={chartConfig.production_hydro_gwh.label}
          />
          <Area
            isAnimationActive={false}
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
    </ChartScaffolding>
  );
}
