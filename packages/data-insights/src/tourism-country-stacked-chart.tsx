"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { tourismCountry, type TourismCountryMeta } from "@workspace/kas-data";
import {
  formatCount,
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
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";

import { buildStackedChartData } from "./lib/stacked-chart";

const CHART_MARGIN = { top: 32, right: 32, bottom: 16, left: 16 };
const PERIOD_GROUPING_OPTIONS: ReadonlyArray<PeriodGroupingOption> =
  getPeriodGroupingOptions(tourismCountry.meta.time.granularity);
const TIME_RANGE_OPTIONS = limitTimeRangeOptions(tourismCountry.meta.time);
const DEFAULT_TIME_RANGE: TimeRangeOption = 24;

type TourismMetric = TourismCountryMeta["metrics"][number];

const DEFAULT_TOP_COUNTRIES = 5;

export function TourismCountryStackedChart({
  top = DEFAULT_TOP_COUNTRIES,
}: {
  top?: number;
}) {
  const [metricKey, setMetricKey] = React.useState<TourismMetric>("visitors");
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    tourismCountry.meta.time.granularity,
  );
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const datasetView = React.useMemo(
    () => tourismCountry.limit(timeRange),
    [timeRange],
  );

  const totals = React.useMemo(
    () =>
      datasetView.summarizeStack({
        keyAccessor: (record) => record.country,
        valueAccessor: (record) => record[metricKey],
        dimension: "country",
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
      keyAccessor: (record) => record.country,
      valueAccessor: (record) => record[metricKey],
      dimension: "country",
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
          Nuk ka të dhëna për vendet e turizmit.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <OptionSelector<TourismMetric>
          value={metricKey}
          onChange={(value) => setMetricKey(value)}
          options={tourismCountry.meta.fields}
          label="Metrika"
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
        selectionLabel="Zgjidh vendet"
        searchPlaceholder="Kërko vende..."
        includeOther={includeOther}
        onIncludeOtherChange={onIncludeOtherChange}
        excludedKeys={excludedKeys}
        onExcludedKeysChange={setExcludedKeys}
      />
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
