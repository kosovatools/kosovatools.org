"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useStackChartState, getPeriodFormatter } from "@workspace/utils";
import { tradeChaptersYearly } from "@workspace/kas-data";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import {
  OptionSelector,
  type SelectorOptionDefinition,
} from "@workspace/ui/custom-components/option-selector";
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useStackedKeySelection } from "@workspace/ui/hooks/use-stacked-key-selection";
import { tradeChaptersStackChartSpec } from "./chart-specs";

const spec = tradeChaptersStackChartSpec;
const DEFAULT_TOP_CHAPTERS = spec.defaults.top ?? 6;
const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };
const data = tradeChaptersYearly.records;

export function TradeChapterStackedChart({
  top = DEFAULT_TOP_CHAPTERS,
}: {
  top?: number;
}) {
  const {
    metric,
    metricKey,
    setMetricKey,
    metricOptions,
    buildSeries,
    summarizeTotals,
    periodGrouping,
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
    onIncludeOtherChange,
    excludedKeys,
    setExcludedKeys,
    onSelectedKeysChange,
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
        <OptionSelector
          value={metricKey}
          onChange={(nextKey) => setMetricKey(nextKey)}
          options={metricSelectorOptions}
          label="Fluksi"
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
        config={config}
        className="aspect-[1/1.5] sm:aspect-video"
      >
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
              metric.formatters.value(value as number)
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
              stackId="chapters"
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
