"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { tourismCountry } from "@workspace/kas-data";
import { useStackChartState, getPeriodFormatter } from "@workspace/utils";

import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import {
  OptionSelector,
  SelectorOptionDefinition,
} from "@workspace/ui/custom-components/option-selector";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";
import { formatCountValue } from "./formatters";
import { tourismCountryStackChartSpec } from "./chart-specs";

const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };
const spec = tourismCountryStackChartSpec;
const DEFAULT_TOP_COUNTRIES = spec.defaults.top ?? 5;
const data = tourismCountry.records;

export function TourismCountryStackedChart({
  top = DEFAULT_TOP_COUNTRIES,
}: {
  top?: number;
}) {
  const {
    metric,
    metricKey,
    setMetricKey,
    metricOptions,
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    buildSeries,
    summarizeTotals,
  } = useStackChartState(spec);

  const metricSelectorOptions = React.useMemo<
    ReadonlyArray<SelectorOptionDefinition<string>>
  >(
    () =>
      metricOptions.map((entry) => ({
        key: entry.key,
        label: entry.label,
      })),
    [metricOptions],
  );

  const totals = React.useMemo(() => summarizeTotals(data), [summarizeTotals]);

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

  const { chartData, keyMap, config } = React.useMemo(() => {
    if (!data.length) {
      return { chartData: [], keyMap: [], config: {} };
    }

    const { keys, series, labelMap } = buildSeries(data, {
      top,
      includeOther,
      selectedKeys,
      excludedKeys,
    });

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(periodGrouping),
    });
  }, [
    top,
    includeOther,
    selectedKeys,
    excludedKeys,
    periodGrouping,
    buildSeries,
  ]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: metric.formatters.value,
    formatTotal: (value) =>
      (metric.formatters.total ?? metric.formatters.value)(value),
  });

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={config}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për vendet e turizmit.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <OptionSelector
          value={metricKey}
          onChange={(value) => setMetricKey(value)}
          options={metricSelectorOptions}
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
      <ChartContainer config={config} className="">
        <AreaChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={(value) =>
              metric.formatters.axis?.(value as number) ??
              formatCountValue(value as number)
            }
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={tooltip.labelFormatter}
                formatter={tooltip.formatter}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {keyMap.map((entry) => (
            <Area
              key={entry.id}
              type="monotone"
              dataKey={entry.id}
              stackId="tourism"
              stroke={`var(--color-${entry.id})`}
              fill={`var(--color-${entry.id})`}
              fillOpacity={0.85}
              name={entry.label}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
