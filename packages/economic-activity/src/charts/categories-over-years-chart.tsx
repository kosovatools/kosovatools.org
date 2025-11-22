"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
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
import { formatCurrencyCompact } from "@workspace/utils";
import { useDatasetTimeControls } from "@workspace/ui/lib/use-dataset-time-controls";

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
          margin={COMMON_CHART_MARGINS}
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
            labelFormatter={periodFormatter}
            valueFormatter={(value) =>
              formatCurrencyCompact(value as number | null)
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
