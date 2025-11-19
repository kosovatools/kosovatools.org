"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  formatCurrencyCompact,
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodGrouping,
  type PeriodGroupingOption,
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
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import {
  type ToDatasetView,
  type TradeChaptersMonthlyDataset,
} from "@workspace/kas-data";

type TradeChaptersDatasetView = ToDatasetView<TradeChaptersMonthlyDataset>;

type TradeChapterMetric =
  TradeChaptersMonthlyDataset["meta"]["metrics"][number];

const DEFAULT_TOP_CHAPTERS = 6;
const CHART_MARGIN = { top: 32, right: 32, bottom: 16, left: 16 };

export function TradeChapterStackedChart({
  dataset,
  top = DEFAULT_TOP_CHAPTERS,
  timelineEvents,
}: {
  dataset: TradeChaptersDatasetView;
  top?: number;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const PERIOD_GROUPING_OPTIONS: ReadonlyArray<PeriodGroupingOption> =
    getPeriodGroupingOptions(dataset.meta.time.granularity);
  const TIME_RANGE_OPTIONS = limitTimeRangeOptions(dataset.meta.time);

  const [metricKey, setMetricKey] =
    React.useState<TradeChapterMetric>("imports");
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    dataset.meta.time.granularity,
  );
  const [timeRange, setTimeRange] = React.useState<TimeRangeOption>(60);

  const datasetView = React.useMemo(
    () => dataset.limit(timeRange),
    [dataset, timeRange],
  );

  const totals = React.useMemo(
    () =>
      datasetView.summarizeStack({
        keyAccessor: (record) => record.chapter,
        valueAccessor: (record) => record[metricKey],
        dimension: "chapter",
      }),
    [datasetView, metricKey],
  );

  const {
    selectedKeys,
    includeOther,
    excludedKeys,
    setExcludedKeys,
    onSelectedKeysChange,
    onIncludeOtherChange,
  } = useStackedKeySelection({
    totals,
    topCount: top,
    initialIncludeOther: true,
  });

  const stackResult = React.useMemo(() => {
    if (!datasetView.records.length) {
      return null;
    }

    return datasetView.viewAsStack({
      keyAccessor: (record) => record.chapter,
      valueAccessor: (record) => record[metricKey],
      dimension: "chapter",
      selectedKeys,
      excludedKeys,
      includeOther,
      periodGrouping,
    });
  }, [
    datasetView,
    metricKey,
    selectedKeys,
    excludedKeys,
    includeOther,
    periodGrouping,
  ]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <OptionSelector
          value={metricKey}
          onChange={(nextKey) => setMetricKey(nextKey)}
          options={dataset.meta.fields}
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
      </div>
      <StackedKeySelector
        totals={totals}
        selectedKeys={selectedKeys}
        onSelectedKeysChange={onSelectedKeysChange}
        topCount={top}
        selectionLabel="Zgjidh kapitujt"
        searchPlaceholder="Kërko kapitujt..."
        includeOther={includeOther}
        onIncludeOtherChange={onIncludeOtherChange}
        excludedKeys={excludedKeys}
        onExcludedKeysChange={setExcludedKeys}
      />
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
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
            content={
              <ChartTooltipContent
                valueFormatter={(value) =>
                  formatCurrencyCompact(value as number, { currency: "EUR" })
                }
              />
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
