"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatCurrencyCompact } from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  StackedKeySelector,
  createInitialStackedKeySelection,
  type StackedKeySelectionState,
} from "@workspace/ui/custom-components/stacked-key-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import { type TradeChaptersMonthlyDatasetView } from "@workspace/kas-data";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";

const DEFAULT_TOP_CHAPTERS = 6;

export function TradeChapterStackedChart({
  dataset,
  top = DEFAULT_TOP_CHAPTERS,
  timelineEvents,
}: {
  dataset: TradeChaptersMonthlyDatasetView;
  top?: number;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions: PERIOD_GROUPING_OPTIONS,
    timeRange,
    setTimeRange,
    timeRangeOptions: TIME_RANGE_OPTIONS,
    datasetView,
    periodFormatter,
    metric,
    setMetric,
    metricOptions,
  } = useDeriveChartControls(dataset, { initialMetric: "imports" });

  const totals = React.useMemo(
    () =>
      datasetView.summarizeStack({
        valueAccessor: (record) => record[metric],
        dimension: "chapter",
      }),
    [datasetView, metric],
  );

  const [selection, setSelection] = React.useState<StackedKeySelectionState>(
    () =>
      createInitialStackedKeySelection({
        totals,
        topCount: top,
        initialIncludeOther: true,
      }),
  );

  const stackResult = React.useMemo(() => {
    return datasetView.viewAsStack({
      valueAccessor: (record) => record[metric],
      dimension: "chapter",
      selectedKeys: selection.selectedKeys,
      excludedKeys: selection.excludedKeys,
      includeOther: selection.includeOther,
      periodGrouping,
    });
  }, [datasetView, metric, selection, periodGrouping]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <OptionSelector
          value={metric}
          onChange={(nextKey) => setMetric(nextKey)}
          options={metricOptions}
          label="Fluksi"
        />
        <OptionSelector
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={PERIOD_GROUPING_OPTIONS}
          label="Perioda"
        />
        <OptionSelector
          value={timeRange}
          onChange={setTimeRange}
          options={TIME_RANGE_OPTIONS}
          label="Intervali"
        />
        <StackedKeySelector
          totals={totals}
          selection={selection}
          onSelectionChange={setSelection}
          topCount={top}
          selectionLabel="Zgjedh kapitujt"
          searchPlaceholder="Kërko kapitujt..."
        />
      </div>
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
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
            tickFormatter={(value) => formatCurrencyCompact(value as number)}
            axisLine={false}
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
          {chartKeys.map((key) => {
            const label = chartConfig[key]?.label;
            const seriesName = typeof label === "string" ? label : key;

            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="chapters"
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.2}
                name={seriesName}
              />
            );
          })}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
