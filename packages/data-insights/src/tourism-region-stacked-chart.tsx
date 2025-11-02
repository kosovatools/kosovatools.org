"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import {
  buildRegionStackSeries,
  formatCount,
  type StackPeriodGrouping,
  type TourismRegionRecord,
} from "@workspace/stats";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "./stacked-chart-helpers";
import { useChartTooltipFormatters } from "./use-chart-tooltip-formatters";
import {
  STACKED_PERIOD_GROUPING_OPTIONS,
  getStackedPeriodFormatter,
} from "./stacked-period-utils";

const groups = [
  { id: "total", label: "Total" },
  { id: "local", label: "Local" },
  { id: "external", label: "External" },
] as const;

export function TourismRegionCharts({
  data,
  months,
}: {
  data: TourismRegionRecord[];
  months?: number;
}) {
  const [group, setGroup] =
    React.useState<(typeof groups)[number]["id"]>("total");

  const [periodGrouping, setPeriodGrouping] =
    React.useState<StackPeriodGrouping>("yearly");

  const { chartData, keyMap, config } = React.useMemo(() => {
    const { keys, series, labelMap } = buildRegionStackSeries(data, {
      months,
      group,
      periodGrouping,
    });

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getStackedPeriodFormatter(periodGrouping),
    });
  }, [data, group, months, periodGrouping]);

  const latestSummary = React.useMemo<{
    periodLabel: string;
    total: number;
  } | null>(() => {
    if (!chartData.length || !keyMap.length) {
      return null;
    }

    const lastRow = chartData.at(-1);
    if (!lastRow) {
      return null;
    }

    const total = keyMap.reduce(
      (sum, entry) => sum + Number(lastRow[entry.id] ?? 0),
      0,
    );

    return {
      periodLabel:
        typeof lastRow.periodLabel === "string"
          ? lastRow.periodLabel
          : String(lastRow.periodLabel ?? ""),
      total,
    };
  }, [chartData, keyMap]);

  const tooltip = useChartTooltipFormatters({
    keys: keyMap,
    formatValue: (value) => `${formatCount(value)} visitors`,
    formatTotal: (value) => `${formatCount(value)} visitors`,
    missingValueLabel: "Not reported",
  });

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No tourism region data available.
        </div>
      </ChartContainer>
    );
  }

  const groupLabel =
    groups.find((option) => option.id === group)?.label ?? "Total";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Visitor group</span>
          <div className="flex gap-2 text-xs">
            {groups.map((option) => {
              const active = option.id === group;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setGroup(option.id)}
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
            {STACKED_PERIOD_GROUPING_OPTIONS.map((option) => {
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

      {latestSummary ? (
        <p className="text-xs text-muted-foreground">
          Latest period ({latestSummary.periodLabel}):{" "}
          <span className="font-medium text-foreground">
            {formatCount(latestSummary.total)}
          </span>{" "}
          {groupLabel.toLowerCase()} visitors across all regions.
        </p>
      ) : null}

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
              stackId="tourism-regions"
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
