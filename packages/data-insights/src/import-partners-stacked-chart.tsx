"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import {
  buildPartnerStackSeries,
  summarizePartnerTotals,
  type TradePartnerRecord,
  formatEuro,
  formatEuroCompact,
} from "@workspace/stats";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "./stacked-chart-helpers";
import { StackedKeySelector } from "./stacked-key-selector";
import { useChartTooltipFormatters } from "./use-chart-tooltip-formatters";

const DEFAULT_TOP_PARTNERS = 5;

const axisFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "2-digit",
});

export function ImportPartnersStackedChart({
  data,
  months,
  top = DEFAULT_TOP_PARTNERS,
}: {
  data: TradePartnerRecord[];
  months?: number;
  top?: number;
}) {
  const totals = React.useMemo(
    () => summarizePartnerTotals(data, months),
    [data, months],
  );

  const defaultKeys = React.useMemo(
    () => totals.slice(0, Math.max(1, top)).map((item) => item.key),
    [totals, top],
  );

  const [selectedKeys, setSelectedKeys] = React.useState<string[]>(defaultKeys);
  const [includeOther, setIncludeOther] = React.useState(true);
  const [excludedKeys, setExcludedKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    setSelectedKeys((current) => {
      if (!totals.length) {
        return [];
      }
      const validKeys = new Set(totals.map((item) => item.key));
      const next = current.filter((key) => validKeys.has(key));
      if (next.length === current.length) {
        return current;
      }
      if (!next.length) {
        return defaultKeys;
      }
      return next;
    });
  }, [totals, defaultKeys]);

  React.useEffect(() => {
    const validKeys = new Set(totals.map((item) => item.key));
    setExcludedKeys((previous) => {
      const next = previous.filter((key) => validKeys.has(key));
      return next.length === previous.length ? previous : next;
    });
  }, [totals]);

  const handleSelectedKeysChange = React.useCallback((keys: string[]) => {
    setSelectedKeys(keys);
  }, []);

  const handleIncludeOtherChange = React.useCallback((next: boolean) => {
    setIncludeOther(next);
  }, []);

  const { chartData, keyMap, config } = React.useMemo(() => {
    const { keys, series, labelMap } = buildPartnerStackSeries(data, {
      months,
      top,
      includeOther,
      selectedKeys,
      excludedKeys,
    });

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: (period) =>
        axisFormatter.format(new Date(`${period}-01`)),
    });
  }, [data, months, top, includeOther, selectedKeys, excludedKeys]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => formatEuro(value),
    missingValueLabel: "Not reported",
  });

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No partner data available.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StackedKeySelector
        totals={totals}
        selectedKeys={selectedKeys}
        onSelectedKeysChange={handleSelectedKeysChange}
        topCount={top}
        formatTotal={(value) => formatEuro(value)}
        selectionLabel="Select partners"
        searchPlaceholder="Search countries..."
        includeOther={includeOther}
        onIncludeOtherChange={handleIncludeOtherChange}
        promoteLabel="Enable “Other” aggregation"
        excludedKeys={excludedKeys}
        onExcludedKeysChange={setExcludedKeys}
      />
      <ChartContainer config={config} className="h-[360px] !aspect-auto">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periodLabel"
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
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
          <Legend />
          {keyMap.map((entry) => (
            <Area
              key={entry.id}
              type="monotone"
              dataKey={entry.id}
              stackId="partners"
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
