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
  buildPartnerStackSeries,
  summarizePartnerTotals,
  type TradePartnerRecord,
  formatEuro,
  formatEuroCompact,
  type StackPeriodGrouping,
  STACK_PERIOD_GROUPING_OPTIONS,
  getStackPeriodFormatter,
  type TimeRangeOption,
  DEFAULT_TIME_RANGE_OPTIONS,
  DEFAULT_TIME_RANGE,
  monthsFromRange,
} from "@workspace/stats";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { StackedKeySelector } from "@workspace/ui/custom-components/stacked-key-selector";
import { TimeRangeSelector } from "@workspace/ui/custom-components/time-range-selector";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "./use-timeline-event-markers";

const DEFAULT_TOP_PARTNERS = 5;
const CHART_MARGIN = { top: 56, right: 24, left: 8, bottom: 0 };

export function ImportPartnersStackedChart({
  data,
  months,
  top = DEFAULT_TOP_PARTNERS,
}: {
  data: TradePartnerRecord[];
  months?: number;
  top?: number;
}) {
  const [periodGrouping, setPeriodGrouping] =
    React.useState<StackPeriodGrouping>("yearly");

  const controlledMonths =
    typeof months === "number" && Number.isFinite(months) && months > 0
      ? months
      : undefined;

  const [range, setRange] = React.useState<TimeRangeOption>(
    controlledMonths ?? DEFAULT_TIME_RANGE,
  );

  React.useEffect(() => {
    if (controlledMonths != null) {
      setRange(controlledMonths);
    }
  }, [controlledMonths]);

  const monthsLimit = controlledMonths ?? monthsFromRange(range);

  const totals = React.useMemo(
    () =>
      summarizePartnerTotals(data, {
        months: monthsLimit,
        periodGrouping,
      }),
    [data, monthsLimit, periodGrouping],
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
      months: monthsLimit,
      top,
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
    monthsLimit,
    top,
    includeOther,
    selectedKeys,
    excludedKeys,
    periodGrouping,
  ]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => formatEuro(value),
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
  );

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për partnerët.
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
      {controlledMonths == null ? (
        <TimeRangeSelector
          value={range}
          onChange={setRange}
          options={DEFAULT_TIME_RANGE_OPTIONS}
          label="Intervali"
        />
      ) : null}
      <StackedKeySelector
        totals={totals}
        selectedKeys={selectedKeys}
        onSelectedKeysChange={handleSelectedKeysChange}
        topCount={top}
        formatTotal={(value) => formatEuro(value)}
        selectionLabel="Zgjidh partnerët"
        searchPlaceholder="Kërko shtetet..."
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
            tickFormatter={(value) => formatEuroCompact(value as number)}
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
