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
  timelineEvents,
  tourismRegion,
  type TourismRegionRecord,
} from "@workspace/kas-data";
import { useStackChartState, getPeriodFormatter } from "@workspace/utils";

import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { buildStackedChartView } from "@workspace/ui/lib/stacked-chart-helpers";
import {
  OptionSelector,
  type SelectorOptionDefinition,
} from "@workspace/ui/custom-components/option-selector";
import { useChartTooltipFormatters } from "@workspace/ui/hooks/use-chart-tooltip-formatters";
import { useTimelineEventMarkers } from "@workspace/ui/hooks/use-timeline-event-markers";
import { formatCountValue } from "./formatters";
import { tourismRegionStackChartSpec } from "./chart-specs";

const DEFAULT_GROUP_LABEL = "Total";

const getVisitorGroupLabelText = (
  label: React.ReactNode | null | undefined,
  fallback = DEFAULT_GROUP_LABEL,
) => {
  if (typeof label === "string") {
    return label;
  }
  if (typeof label === "number") {
    return String(label);
  }
  return fallback;
};

const visitorGroupOptions: SelectorOptionDefinition<
  TourismRegionRecord["visitor_group"]
>[] =
  tourismRegion.meta.dimensions.visitor_group?.map((option) => ({
    key: option.key as TourismRegionRecord["visitor_group"],
    label: option.label,
  })) ?? [];

const DEFAULT_GROUP = "total";
const CHART_MARGIN = { top: 56, right: 0, left: 0, bottom: 0 };
const spec = tourismRegionStackChartSpec;
const data = tourismRegion.records;

export function TourismRegionCharts() {
  const [group, setGroup] =
    React.useState<TourismRegionRecord["visitor_group"]>(DEFAULT_GROUP);

  React.useEffect(() => {
    if (!visitorGroupOptions.some((option) => option.key === group)) {
      setGroup(DEFAULT_GROUP);
    }
  }, [group]);

  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    buildSeries,
  } = useStackChartState(spec);

  const filteredRecords = React.useMemo(
    () =>
      data.filter((record) => (group ? record.visitor_group === group : true)),
    [group],
  );

  const { chartData, keyMap, config } = React.useMemo(() => {
    if (!filteredRecords.length) {
      return { chartData: [], keyMap: [], config: {} };
    }

    const { keys, series, labelMap } = buildSeries(filteredRecords);

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(periodGrouping),
    });
  }, [filteredRecords, buildSeries, periodGrouping]);

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
    formatValue: formatCountValue,
    formatTotal: formatCountValue,
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
    visitorGroupOptions.find((option) => option.key === group)?.label ??
    visitorGroupOptions[0]?.label ??
    DEFAULT_GROUP_LABEL;
  const groupLabelText = getVisitorGroupLabelText(groupLabel);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <OptionSelector
          value={group}
          onChange={(value) => setGroup(value)}
          options={visitorGroupOptions}
          label="Grupi i vizitorëve"
        />
        <OptionSelector
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={periodGroupingOptions}
          label="Perioda"
        />
        <OptionSelector
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
          label="Intervali"
        />
      </div>

      {latestSummary ? (
        <p className="text-xs text-muted-foreground">
          Periudha e fundit ({latestSummary.periodLabel}):{" "}
          <span className="font-medium text-foreground">
            {formatCountValue(latestSummary.total)}
          </span>{" "}
          {groupLabelText.toLowerCase()} vizitorë në të gjitha rajonet.
        </p>
      ) : null}

      <ChartContainer config={config} className="">
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
            tickFormatter={formatCountValue}
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
