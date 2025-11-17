"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  tradeChaptersYearly,
  type TradeChaptersYearlyMeta,
} from "@workspace/kas-data";
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
import {
  OptionSelector,
  type SelectorOptionDefinition,
} from "@workspace/ui/custom-components/option-selector";
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

const PERIOD_GROUPING_OPTIONS: ReadonlyArray<PeriodGroupingOption> =
  getPeriodGroupingOptions(tradeChaptersYearly.meta.time.granularity);
const TIME_RANGE_OPTIONS = limitTimeRangeOptions(tradeChaptersYearly.meta.time);
const DEFAULT_TIME_RANGE: TimeRangeOption = 5;

type TradeChapterMetric = TradeChaptersYearlyMeta["metrics"][number];

const METRIC_OPTIONS: ReadonlyArray<
  SelectorOptionDefinition<TradeChapterMetric>
> = tradeChaptersYearly.meta.fields;

const DEFAULT_TOP_CHAPTERS = 6;
const CHART_MARGIN = { top: 32, right: 32, bottom: 16, left: 16 };

export function TradeChapterStackedChart({
  top = DEFAULT_TOP_CHAPTERS,
}: {
  top?: number;
}) {
  const [metricKey, setMetricKey] =
    React.useState<TradeChapterMetric>("imports");
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    tradeChaptersYearly.meta.time.granularity,
  );
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const datasetView = React.useMemo(
    () => tradeChaptersYearly.limit(timeRange),
    [timeRange],
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

  if (!chartData.length || !chartKeys.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për kapitujt.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <OptionSelector<TradeChapterMetric>
          value={metricKey}
          onChange={(nextKey) => setMetricKey(nextKey)}
          options={METRIC_OPTIONS}
          label="Fluksi"
        />
        <OptionSelector<PeriodGrouping>
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={PERIOD_GROUPING_OPTIONS}
          label="Perioda"
        />
        <OptionSelector<TimeRangeOption>
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
          <ChartTooltip content={<ChartTooltipContent />} />
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
