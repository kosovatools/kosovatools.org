"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import {
  buildCountryStackSeries,
  summarizeCountryTotals,
  type TourismCountryRecord,
  formatCount,
  type StackPeriodGrouping,
  STACK_PERIOD_GROUPING_OPTIONS,
  getStackPeriodFormatter,
} from "@workspace/stats";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "./stacked-chart-helpers";
import { StackedKeySelector } from "./stacked-key-selector";
import { useChartTooltipFormatters } from "./use-chart-tooltip-formatters";

const DEFAULT_TOP_COUNTRIES = 5;

const metricOptions = [
  { id: "visitors" as const, label: "Visitors" },
  { id: "nights" as const, label: "Overnight stays" },
];

export function TourismCountryStackedChart({
  data,
  months,
  top = DEFAULT_TOP_COUNTRIES,
}: {
  data: TourismCountryRecord[];
  months?: number;
  top?: number;
}) {
  const [metric, setMetric] = React.useState<"visitors" | "nights">("visitors");
  const [periodGrouping, setPeriodGrouping] =
    React.useState<StackPeriodGrouping>("yearly");

  const totals = React.useMemo(
    () => summarizeCountryTotals(data, { months, metric, periodGrouping }),
    [data, months, metric, periodGrouping],
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

  const handleIncludeOtherChange = React.useCallback((value: boolean) => {
    setIncludeOther(value);
  }, []);

  const { chartData, keyMap, config } = React.useMemo(() => {
    const { keys, series, labelMap } = buildCountryStackSeries(data, {
      months,
      top,
      metric,
      includeOther,
      selectedKeys,
      excludedKeys,
      periodGrouping,
    });

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getStackPeriodFormatter(periodGrouping),
    });
  }, [
    data,
    months,
    top,
    metric,
    includeOther,
    selectedKeys,
    excludedKeys,
    periodGrouping,
  ]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => formatCount(value),
    missingValueLabel: "Not reported",
  });

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={config}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No tourism country data available.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Metric</span>
          <div className="flex gap-2 text-xs">
            {metricOptions.map((option) => {
              const active = metric === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMetric(option.id)}
                  className={
                    "rounded-full border px-3 py-1 transition-colors " +
                    (active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted")
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">View</span>
          <div className="flex gap-2 text-xs">
            {STACK_PERIOD_GROUPING_OPTIONS.map((option) => {
              const active = periodGrouping === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPeriodGrouping(option.id)}
                  className={
                    "rounded-full border px-3 py-1 transition-colors " +
                    (active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted")
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <StackedKeySelector
        totals={totals}
        selectedKeys={selectedKeys}
        onSelectedKeysChange={handleSelectedKeysChange}
        topCount={top}
        formatTotal={(value) => formatCount(value)}
        selectionLabel="Select countries"
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
            tickFormatter={(value) => formatCount(value as number)}
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
