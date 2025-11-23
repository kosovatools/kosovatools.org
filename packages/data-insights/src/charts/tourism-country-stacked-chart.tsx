"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatCount } from "@workspace/utils";
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
} from "@workspace/ui/custom-components/stacked-key-selector";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
import { TourismCountryDatasetView } from "@workspace/kas-data";

const DEFAULT_TOP_COUNTRIES = 5;

export function TourismCountryStackedChart({
  dataset,
  top = DEFAULT_TOP_COUNTRIES,
  timelineEvents,
}: {
  dataset: TourismCountryDatasetView;
  top?: number;
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
    metric,
    setMetric,
    metricOptions,
  } = useDeriveChartControls(dataset, { initialMetric: "visitors" });

  const totals = React.useMemo(
    () =>
      datasetView.summarizeStack({
        valueAccessor: (record) => record[metric],
        dimension: "country",
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
      dimension: "country",
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
    <ChartScaffolding
      actions={
        <>
          <OptionSelector
            value={metric}
            onChange={(value) => setMetric(value)}
            options={metricOptions}
            label="Metrika"
          />
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
            topCount={top}
            selectionLabel="Zgjedh vendet"
            searchPlaceholder="Kërko vende..."
          />
        </>
      }
    >
      <ChartContainer config={chartConfig}>
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
            tickFormatter={(value) => formatCount(value as number)}
            axisLine={false}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            {...timelineEvents}
          />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) => formatCount(value as number | null)}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => {
            const label = chartConfig[key]?.label;
            const seriesName = typeof label === "string" ? label : key;

            return (
              <Area
                isAnimationActive={false}
                key={key}
                type="monotone"
                dataKey={key}
                stackId="tourism"
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.2}
                name={seriesName}
              />
            );
          })}
        </AreaChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
