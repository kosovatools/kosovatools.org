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
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { useDatasetTimeControls } from "@workspace/ui/lib/use-dataset-time-controls";

import { formatAuto } from "../utils/number-format";

type ElectricityDatasetView = typeof electricityDataset;

export function ElectricityBalanceStackedAreaChart({
  dataset,
  timelineEvents,
}: {
  dataset: ElectricityDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const labelMap = createLabelMap(dataset.meta.fields);

  const chartConfig = addThemeToChartConfig({
    production: { label: labelMap.production_gwh },
    import: { label: labelMap.import_gwh },
  });

  const chartClassName = "w-full aspect-[1/1.5] sm:aspect-video";
  const chartMargin = { top: 56, right: 0, left: 0, bottom: 0 };
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

  const chartData = useMemo(() => {
    const aggregated = datasetView.aggregate<"production" | "import">({
      grouping: periodGrouping,
      fields: [
        {
          key: "production",
          valueAccessor: (record) => sanitizeValue(record.production_gwh, 0),
        },
        {
          key: "import",
          valueAccessor: (record) => sanitizeValue(record.import_gwh, 0),
        },
      ],
    });

    const sortedAggregated = [...aggregated].sort((a, b) =>
      a.period.localeCompare(b.period),
    );

    return sortedAggregated.map((row) => ({
      period: row.period,
      periodLabel: periodFormatter(row.period),
      production: row.production ?? null,
      import: row.import ?? null,
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
        <AreaChart data={chartData} margin={chartMargin}>
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
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
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
            dataKey="production"
            stackId="balance"
            stroke="var(--color-production)"
            fill="var(--color-production)"
            fillOpacity={0.2}
            name={chartConfig.production.label}
          />
          <Area
            type="monotone"
            dataKey="import"
            stackId="balance"
            stroke="var(--color-import)"
            fill="var(--color-import)"
            fillOpacity={0.2}
            name={chartConfig.import.label}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
