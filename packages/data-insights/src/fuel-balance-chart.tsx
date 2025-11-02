"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import {
  buildFuelTypeStackSeries,
  fuelKeys,
  fuelMetricLabels,
  type FuelBalanceRecord,
  type FuelKey,
  type FuelMetric,
  type StackPeriodGrouping,
  formatCount,
  STACK_PERIOD_GROUPING_OPTIONS,
  getStackPeriodFormatter,
} from "@workspace/stats";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { useChartTooltipFormatters } from "@workspace/ui/components/use-chart-tooltip-formatters";

const DEFAULT_METRIC: FuelMetric = "ready_for_market";
const DEFAULT_MONTHS = 36;
const CHART_CLASS = "w-full aspect-[4/3] sm:aspect-video";

type FuelBalanceChartProps = {
  balances: Record<FuelKey, FuelBalanceRecord[]>;
  months?: number;
};

function toMetricOptions(): Array<{ id: FuelMetric; label: string }> {
  return (Object.entries(fuelMetricLabels) as Array<[FuelMetric, string]>).map(
    ([id, label]) => ({ id, label }),
  );
}

const METRIC_OPTIONS = toMetricOptions();

export function FuelBalanceChart({
  balances,
  months = DEFAULT_MONTHS,
}: FuelBalanceChartProps) {
  const [metric, setMetric] = React.useState<FuelMetric>(DEFAULT_METRIC);
  const [periodGrouping, setPeriodGrouping] =
    React.useState<StackPeriodGrouping>("monthly");

  const { chartData, keyMap, config } = React.useMemo(() => {
    const { keys, series, labelMap } = buildFuelTypeStackSeries(balances, {
      months,
      metric,
      selectedKeys: fuelKeys,
      includeOther: false,
      periodGrouping,
    });

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getStackPeriodFormatter(periodGrouping),
    });
  }, [balances, months, metric, periodGrouping]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => `${formatCount(value)} tonë`,
    formatTotal: (value) => `${formatCount(value)} tonë`,
  });

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
            {METRIC_OPTIONS.map((option) => {
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
