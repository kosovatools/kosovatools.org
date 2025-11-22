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
import { formatCurrencyCompact, getPeriodFormatter } from "@workspace/utils";

import type {
  MonthlyCategoryCityDatasetView,
  MonthlyCategoryCityRecord,
} from "@workspace/dataset-api";
import { MONTHLY_STACK_TOP, OTHER_LABEL } from "./constants";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

export function MonthlyCategoryStackedChart({
  dataset,
  timelineEvents,
}: {
  dataset: MonthlyCategoryCityDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const stackConfig = React.useMemo(
    () => ({
      valueAccessor: (record: MonthlyCategoryCityRecord) => record.turnover,
      dimension: "category",
      otherLabel: OTHER_LABEL,
    }),
    [],
  );
  const totals = React.useMemo<StackedKeyTotal[]>(
    () => dataset.summarizeStack(stackConfig),
    [dataset, stackConfig],
  );
  const [selection, setSelection] = React.useState<StackedKeySelectionState>(
    () =>
      createInitialStackedKeySelection({
        totals,
        topCount: MONTHLY_STACK_TOP,
      }),
  );

  const stackResult = React.useMemo(
    () =>
      dataset.viewAsStack({
        ...stackConfig,
        top: MONTHLY_STACK_TOP,
        selectedKeys: selection.selectedKeys,
        includeOther: selection.includeOther,
        excludedKeys: selection.excludedKeys,
      }),
    [dataset, stackConfig, selection],
  );
  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );
  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(dataset.meta.time.granularity),
    [dataset.meta.time.granularity],
  );

  return (
    <div className="space-y-4">
      {totals.length > 0 ? (
        <StackedKeySelector
          totals={totals}
          selection={selection}
          onSelectionChange={setSelection}
          topCount={MONTHLY_STACK_TOP}
          selectionLabel="Zgjedh kategoritë"
          searchPlaceholder="Kërko kategoritë..."
        />
      ) : null}
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
            tickMargin={8}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => periodFormatter(String(value))}
          />
          <YAxis
            width="auto"
            tickFormatter={(value: number) => formatCurrencyCompact(value)}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={dataset.meta.time.granularity}
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
