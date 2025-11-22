"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatCount } from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
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
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import { useDatasetTimeControls } from "@workspace/ui/lib/use-dataset-time-controls";
import { TourismCountryDatasetView } from "@workspace/kas-data";

const CHART_MARGIN = { top: 32, right: 32, bottom: 16, left: 16 };
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
  const [metricKey, setMetricKey] =
    React.useState<TourismCountryDatasetView["meta"]["metrics"][number]>(
      "visitors",
    );
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

  const totals = React.useMemo(
    () =>
      datasetView.summarizeStack({
        keyAccessor: (record) => record.country,
        valueAccessor: (record) => record[metricKey],
        dimension: "country",
      }),
    [datasetView, metricKey],
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
      keyAccessor: (record) => record.country,
      valueAccessor: (record) => record[metricKey],
      dimension: "country",
      selectedKeys: selection.selectedKeys,
      excludedKeys: selection.excludedKeys,
      includeOther: selection.includeOther,
      periodGrouping,
    });
  }, [datasetView, metricKey, selection, periodGrouping]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <OptionSelector
          value={metricKey}
          onChange={(value) => setMetricKey(value)}
          options={dataset.meta.fields}
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
      </div>
      <ChartContainer config={chartConfig}>
        <AreaChart data={chartData} margin={CHART_MARGIN}>
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
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
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
    </div>
  );
}
