"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";

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
  const PERIOD_GROUPING_OPTIONS = getPeriodGroupingOptions(
    dataset.meta.time.granularity,
  );
  const TIME_RANGE_OPTIONS = limitTimeRangeOptions(dataset.meta.time);
  const DEFAULT_TIME_RANGE = 24;

  const chartConfig = addThemeToChartConfig({
    production: { label: labelMap.production_gwh },
    import: { label: labelMap.import_gwh },
  });

  const chartClassName = "w-full aspect-[4/3] sm:aspect-video";
  const chartMargin = { top: 56, right: 0, left: 0, bottom: 0 };
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
            dataKey="period"
            tickFormatter={(value) => periodFormatter(String(value))}
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
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
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
  ) : (
    <ChartContainer config={chartConfig} className={chartClassName}>
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Nuk ka të dhëna për energjinë.
      </div>
    </ChartContainer>
  );
}
