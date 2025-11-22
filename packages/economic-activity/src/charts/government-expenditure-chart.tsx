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
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import { type GovernmentExpenditureDatasetView } from "@workspace/kas-data";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";

const DEFAULT_TOP_CATEGORIES = 5;

export function GovernmentExpenditureStackedChart({
  dataset,
  title,
  selectionLabel,
  searchPlaceholder,
  timelineEvents,
}: {
  dataset: GovernmentExpenditureDatasetView;
  title: string;
  selectionLabel: string;
  searchPlaceholder: string;
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
  } = useDeriveChartControls(dataset);

  const totals = React.useMemo(
    () =>
      datasetView.summarizeStack({
        valueAccessor: (record) => record.amount_eur,
        dimension: "category",
        dimensionOptions: dataset.meta.dimensions.category,
      }),
    [dataset.meta.dimensions.category, datasetView],
  );

  const [selection, setSelection] = React.useState<StackedKeySelectionState>(
    () =>
      createInitialStackedKeySelection({
        totals,
        topCount: DEFAULT_TOP_CATEGORIES,
        initialIncludeOther: true,
      }),
  );

  React.useEffect(() => {
    setSelection((current) =>
      createInitialStackedKeySelection({
        totals,
        topCount: DEFAULT_TOP_CATEGORIES,
        initialIncludeOther: current.includeOther,
      }),
    );
  }, [totals]);

  const stackResult = React.useMemo(() => {
    return datasetView.viewAsStack({
      valueAccessor: (record) => record.amount_eur,
      dimension: "category",
      dimensionOptions: dataset.meta.dimensions.category,
      selectedKeys: selection.selectedKeys,
      excludedKeys: selection.excludedKeys,
      includeOther: selection.includeOther,
      periodGrouping,
    });
  }, [
    dataset.meta.dimensions.category,
    datasetView,
    periodGrouping,
    selection.excludedKeys,
    selection.includeOther,
    selection.selectedKeys,
  ]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <OptionSelector
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={periodGroupingOptions}
          label="Perioda"
        />
        <OptionSelector
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
          label="Intervali"
        />
        <StackedKeySelector
          totals={totals}
          selection={selection}
          onSelectionChange={setSelection}
          topCount={DEFAULT_TOP_CATEGORIES}
          selectionLabel={selectionLabel}
          searchPlaceholder={searchPlaceholder}
        />
      </div>
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.4] sm:aspect-video"
        title={title}
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
            {...timelineEvents}
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
                stackId="gov-finance-exp"
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.25}
                name={seriesName}
              />
            );
          })}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
