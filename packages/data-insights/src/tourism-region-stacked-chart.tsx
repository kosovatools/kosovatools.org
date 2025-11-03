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
  buildRegionStackSeries,
  formatCount,
  type StackPeriodGrouping,
  type TourismRegionRecord,
  STACK_PERIOD_GROUPING_OPTIONS,
  getStackPeriodFormatter,
} from "@workspace/stats";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "./use-timeline-event-markers";

const groups = [
  { id: "total", label: "Totali" },
  { id: "local", label: "Lokal" },
  { id: "external", label: "I jashtëm" },
] as const;
const CHART_MARGIN = { top: 56, right: 24, left: 8, bottom: 0 };

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
      periodFormatter: getStackPeriodFormatter(periodGrouping),
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
    formatValue: (value) => `${formatCount(value)} vizitorë`,
    formatTotal: (value) => `${formatCount(value)} vizitorë`,
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
  );

  if (!chartData.length || !keyMap.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për rajonet e turizmit.
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
          <span className="text-sm text-muted-foreground">
            Grupi i vizitorëve
          </span>
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

      {latestSummary ? (
        <p className="text-xs text-muted-foreground">
          Periudha e fundit ({latestSummary.periodLabel}):{" "}
          <span className="font-medium text-foreground">
            {formatCount(latestSummary.total)}
          </span>{" "}
          {groupLabel.toLowerCase()} vizitorë në të gjitha rajonet.
        </p>
      ) : null}

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
