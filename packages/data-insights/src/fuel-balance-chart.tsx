"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  buildFuelTypeStackSeries,
  fuelKeys,
  fuelMetricLabels,
  type FuelBalanceRecord,
  type FuelKey,
  type FuelMetric,
  timelineEvents,
} from "@workspace/kas-data";
import {
  type StackPeriodGrouping,
  formatCount,
  STACK_PERIOD_GROUPING_OPTIONS,
  getPeriodFormatter,
  type TimeRangeOption,
  DEFAULT_TIME_RANGE_OPTIONS,
  DEFAULT_TIME_RANGE,
  monthsFromRange,
} from "@workspace/chart-utils";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";

const CHART_CLASS = "w-full aspect-[4/3] sm:aspect-video";
const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };

type FuelBalanceChartProps = {
  balances: Record<FuelKey, FuelBalanceRecord[]>;
};

const DEFAULT_METRIC: FuelMetric = "ready_for_market";

export function FuelBalanceChart({ balances }: FuelBalanceChartProps) {
  const [metric, setMetric] = React.useState<FuelMetric>(DEFAULT_METRIC);
  const [periodGrouping, setPeriodGrouping] =
    React.useState<StackPeriodGrouping>("monthly");

  const [range, setRange] = React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const monthsLimit = monthsFromRange(range);

  const { chartData, keyMap, config } = React.useMemo(() => {
    const { keys, series, labelMap } = buildFuelTypeStackSeries(balances, {
      months: monthsLimit,
      metric,
      selectedKeys: fuelKeys,
      includeOther: false,
      periodGrouping,
    });

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(periodGrouping),
    });
  }, [balances, metric, monthsLimit, periodGrouping]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => `${formatCount(value)} tonë`,
    formatTotal: (value) => `${formatCount(value)} tonë`,
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
    timelineEvents,
  );

  const latestSummary = React.useMemo(() => {
    if (!chartData.length || !keyMap.length) {
      return null;
    }
    const latest = chartData.at(-1);
    if (!latest) {
      return null;
    }
    const total = keyMap.reduce((sum, entry) => {
      const value = latest[entry.id];
      return typeof value === "number" && Number.isFinite(value)
        ? sum + value
        : sum;
    }, 0);

    return {
      periodLabel:
        typeof latest.periodLabel === "string" ? latest.periodLabel : null,
      total,
    };
  }, [chartData, keyMap]);

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={{}} className={CHART_CLASS}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për karburantet.
        </div>
      </ChartContainer>
    );
  }

  const metricLabel = fuelMetricLabels[metric];
  const summaryDisplay =
    latestSummary && latestSummary.total != null
      ? `${formatCount(latestSummary.total)} tonë`
      : "Të dhënat mungojnë";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Metrika</span>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(fuelMetricLabels).map(([id, label]) => {
              const active = metric === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMetric(id as FuelMetric)}
                  className={
                    "rounded-full border px-3 py-1 transition-colors " +
                    (active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted")
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <OptionSelector
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={STACK_PERIOD_GROUPING_OPTIONS}
          label="Perioda"
        />
        <OptionSelector
          value={range}
          onChange={setRange}
          options={DEFAULT_TIME_RANGE_OPTIONS}
          label="Intervali"
        />
      </div>
      <div className="text-sm text-muted-foreground">
        Periudha e fundit{" "}
        {latestSummary?.periodLabel ? (
          <>
            ({latestSummary.periodLabel}):{" "}
            <span className="font-medium text-foreground">
              {summaryDisplay}
            </span>{" "}
            total {metricLabel.toLowerCase()} në të gjitha llojet e
            karburanteve.
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">
              {summaryDisplay}
            </span>{" "}
            total {metricLabel.toLowerCase()} në të gjitha llojet e
            karburanteve.
          </>
        )}
      </div>
      <ChartContainer config={config} className={CHART_CLASS}>
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
          <ChartLegend content={<ChartLegendContent />} />
          {keyMap.map((entry) => (
            <Area
              key={entry.id}
              type="monotone"
              dataKey={entry.id}
              stackId="fuel-balance"
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
