"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  formatEuroCompact,
  getPeriodFormatter,
  type StackPeriodGrouping,
} from "@workspace/chart-utils";
import {
  buildExportChapterStackSeries,
  buildImportChapterStackSeries,
  summarizeExportChapterTotals,
  summarizeImportChapterTotals,
  type TradeChapterYearRecord,
} from "@workspace/kas-data";
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

const DEFAULT_TOP_CHAPTERS = 6;
const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };

type ChartMode = "exports" | "imports";

const FLOW_OPTIONS: ReadonlyArray<SelectorOptionDefinition<ChartMode>> = [
  { id: "exports", label: "Eksportet (FOB)" },
  { id: "imports", label: "Importet (CIF)" },
];

const PERIOD_GROUPING: StackPeriodGrouping = "yearly";

export function TradeChapterStackedChart({
  data,
  top = DEFAULT_TOP_CHAPTERS,
}: {
  data: TradeChapterYearRecord[];
  top?: number;
}) {
  const [mode, setMode] = React.useState<ChartMode>("exports");

  const totals = React.useMemo(() => {
    const options = { periodGrouping: PERIOD_GROUPING };
    return mode === "exports"
      ? summarizeExportChapterTotals(data, options)
      : summarizeImportChapterTotals(data, options);
  }, [mode, data]);

  const {
    selectedKeys,
    setSelectedKeys,
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
    const commonOptions = {
      top,
      includeOther,
      selectedKeys,
      excludedKeys,
      periodGrouping: PERIOD_GROUPING,
    };
    const { keys, series, labelMap } =
      mode === "exports"
        ? buildExportChapterStackSeries(data, commonOptions)
        : buildImportChapterStackSeries(data, commonOptions);

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(PERIOD_GROUPING),
    });
  }, [mode, data, top, includeOther, selectedKeys, excludedKeys]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => formatEuroCompact(value),
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
        <OptionSelector<ChartMode>
          value={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setSelectedKeys([]);
          }}
          options={FLOW_OPTIONS}
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
            tickFormatter={(value) => formatEuroCompact(value as number)}
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
