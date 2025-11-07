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
  buildRegionStackSeries,
  tourismRegionMeta,
  type TourismRegionRecord,
  timelineEvents,
} from "@workspace/kas-data";
import {
  formatCount,
  type StackPeriodGrouping,
  STACK_PERIOD_GROUPING_OPTIONS,
  getPeriodFormatter,
  type TimeRangeOption,
  DEFAULT_TIME_RANGE_OPTIONS,
  DEFAULT_TIME_RANGE,
  monthsFromRange,
} from "@workspace/chart-utils";

import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";

type VisitorGroupOption = {
  id: TourismRegionRecord["visitor_group"];
  label: string;
};

const visitorGroupOptions: VisitorGroupOption[] =
  tourismRegionMeta.visitor_groups.map((id) => ({
    id: id as TourismRegionRecord["visitor_group"],
    label: tourismRegionMeta.visitor_group_labels[id] ?? id,
  }));

const DEFAULT_GROUP: TourismRegionRecord["visitor_group"] =
  visitorGroupOptions[0]?.id ?? "total";
const CHART_MARGIN = { top: 56, right: 24, left: 8, bottom: 0 };

export function TourismRegionCharts({ data }: { data: TourismRegionRecord[] }) {
  const [group, setGroup] =
    React.useState<TourismRegionRecord["visitor_group"]>(DEFAULT_GROUP);

  React.useEffect(() => {
    if (!visitorGroupOptions.some((option) => option.id === group)) {
      setGroup(DEFAULT_GROUP);
    }
  }, [group]);

  const [periodGrouping, setPeriodGrouping] =
    React.useState<StackPeriodGrouping>("yearly");

  const [range, setRange] = React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const monthsLimit = monthsFromRange(range);

  const { chartData, keyMap, config } = React.useMemo(() => {
    const { keys, series, labelMap } = buildRegionStackSeries(data, {
      months: monthsLimit,
      group,
      periodGrouping,
    });

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(periodGrouping),
    });
  }, [data, group, monthsLimit, periodGrouping]);

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
    formatValue: (value) => formatCount(value),
    formatTotal: (value) => formatCount(value),
  });

  const eventMarkers = useTimelineEventMarkers(
    chartData as Array<{ period: string; periodLabel: string }>,
    periodGrouping,
    timelineEvents,
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
    visitorGroupOptions.find((option) => option.id === group)?.label ??
    visitorGroupOptions[0]?.label ??
    "Total";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Grupi i vizitorëve
          </span>
          <div className="flex gap-2 text-xs">
            {visitorGroupOptions.map((option) => {
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
          <ChartLegend content={<ChartLegendContent />} />
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
