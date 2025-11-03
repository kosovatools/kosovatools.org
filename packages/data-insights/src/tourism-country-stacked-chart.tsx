"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

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
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "./use-timeline-event-markers";

const DEFAULT_TOP_COUNTRIES = 5;

const metricOptions = [
  { id: "visitors" as const, label: "Vizitorë" },
  { id: "nights" as const, label: "Qëndrime nate" },
];

const CHART_MARGIN = { top: 56, right: 24, left: 8, bottom: 0 };

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
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
  );

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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Metrika</span>
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
          <span className="text-sm text-muted-foreground">Perioda</span>
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
        selectionLabel="Zgjidh vendet"
        searchPlaceholder="Kërko vende..."
        includeOther={includeOther}
        onIncludeOtherChange={handleIncludeOtherChange}
        promoteLabel='Aktivizo grupimin "Të tjerët"'
        excludedKeys={excludedKeys}
        onExcludedKeysChange={setExcludedKeys}
      />
      <ChartContainer config={config} className="h-[360px] !aspect-auto">
        <AreaChart data={chartData} margin={CHART_MARGIN}>
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
          {eventMarkers.map((event) => (
            <ReferenceLine
              key={event.id}
              x={event.x}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
              isFront
            >
              <Label
                value={event.label}
                position="top"
                fill="var(--muted-foreground)"
                fontSize={10}
                offset={4}
              />
            </ReferenceLine>
          ))}
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
