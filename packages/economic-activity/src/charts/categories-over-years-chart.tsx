"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  StackedKeySelector,
  createInitialStackedKeySelection,
  type StackedKeySelectionState,
  type StackedKeyTotal,
} from "@workspace/ui/custom-components/stacked-key-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  formatCurrencyCompact,
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodGrouping,
  type TimeRangeOption,
} from "@workspace/utils";

import type {
  TurnoverCategoriesDatasetView,
  TurnoverCategoryRecord,
} from "@workspace/dataset-api";
import { CATEGORY_STACK_TOP, OTHER_LABEL } from "./constants";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

export function CategoriesOverYearsChart({
  dataset,
  timelineEvents,
}: {
  dataset: TurnoverCategoriesDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const periodGroupingOptions = React.useMemo(
    () => getPeriodGroupingOptions(dataset.meta.time.granularity),
    [dataset.meta.time.granularity],
  );
  const timeRangeOptions = React.useMemo(
    () => limitTimeRangeOptions(dataset.meta.time),
    [dataset.meta.time],
  );
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    dataset.meta.time.granularity,
  );
  const [timeRange, setTimeRange] = React.useState<TimeRangeOption>(5);

  const datasetView = React.useMemo(() => {
    if (timeRange == null || Number.isNaN(timeRange)) {
      return dataset;
    }
    return dataset.limit(timeRange);
  }, [dataset, timeRange]);

  const stackConfig = React.useMemo(
    () => ({
      keyAccessor: (record: TurnoverCategoryRecord) => record.category,
      valueAccessor: (record: TurnoverCategoryRecord) => record.turnover,
      dimension: "category",
      otherLabel: OTHER_LABEL,
    }),
    [],
  );
  const totals = React.useMemo<StackedKeyTotal[]>(
    () =>
      datasetView.summarizeStack({
        ...stackConfig,
        periodGrouping,
      }),
    [datasetView, stackConfig, periodGrouping],
  );
  const [selection, setSelection] = React.useState<StackedKeySelectionState>(
    () =>
      createInitialStackedKeySelection({
        totals,
        topCount: CATEGORY_STACK_TOP,
      }),
  );

  const stackResult = React.useMemo(
    () =>
      datasetView.viewAsStack({
        ...stackConfig,
        top: CATEGORY_STACK_TOP,
        selectedKeys: selection.selectedKeys,
        includeOther: selection.includeOther,
        excludedKeys: selection.excludedKeys,
        periodGrouping,
      }),
    [datasetView, stackConfig, selection, periodGrouping],
  );
  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );
  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  if (!chartData.length || !chartKeys.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna të mjaftueshme për këtë periudhë.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap  justify-between items-center gap-3">
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
        {totals.length > 0 ? (
          <StackedKeySelector
            totals={totals}
            selection={selection}
            onSelectionChange={setSelection}
            topCount={CATEGORY_STACK_TOP}
            selectionLabel="Zgjedh kategoritë"
            searchPlaceholder="Kërko kategoritë..."
          />
        ) : null}
      </div>
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 24, bottom: 12, left: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => periodFormatter(String(value))}
          />
          <YAxis
            width="auto"
            tickFormatter={(value: number) => formatCurrencyCompact(value)}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => periodFormatter(value as string)}
                valueFormatter={(value) =>
                  formatCurrencyCompact(value as number, { currency: "EUR" })
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => (
            <Area
              key={key}
              dataKey={key}
              type="monotone"
              stackId="turnover"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              fill={`var(--color-${key})`}
              fillOpacity={0.2}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
