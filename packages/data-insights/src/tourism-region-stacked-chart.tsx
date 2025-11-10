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
  createLabelMap,
  type TourismRegionRecord,
} from "@workspace/kas-data";
import {
  buildStackSeries,
  formatCount,
  type PeriodGrouping,
  PERIOD_GROUPING_OPTIONS,
  getPeriodFormatter,
  type TimeRangeOption,
  DEFAULT_TIME_RANGE_OPTIONS,
  DEFAULT_TIME_RANGE,
  monthsFromRange,
} from "@workspace/utils";

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

type RegionStackRecord = {
  period: string;
  region: string;
  value: number;
};

const regionAccessors = {
  period: (record: RegionStackRecord) => record.period,
  key: (record: RegionStackRecord) => record.region,
  value: (record: RegionStackRecord) => record.value,
};

const regionLabelMap = createLabelMap(tourismRegion.meta.dimensions.region);

const labelForRegion = (key: string) => regionLabelMap[key] ?? key;

const sanitizeValue = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const data = tourismRegion.records;

export function TourismRegionCharts() {
  const [group, setGroup] =
    React.useState<TourismRegionRecord["visitor_group"]>(DEFAULT_GROUP);

  React.useEffect(() => {
    if (!visitorGroupOptions.some((option) => option.key === group)) {
      setGroup(DEFAULT_GROUP);
    }
  }, [group]);

  const [periodGrouping, setPeriodGrouping] =
    React.useState<PeriodGrouping>("yearly");

  const [range, setRange] = React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  const monthsLimit = monthsFromRange(range);

  const filteredRecords = React.useMemo(
    () =>
      data.filter((record) => (group ? record.visitor_group === group : true)),
    [group],
  );

  const stackRecords = React.useMemo<RegionStackRecord[]>(() => {
    if (!filteredRecords.length) return [];
    return filteredRecords.map((record) => ({
      period: record.period,
      region: record.region,
      value: sanitizeValue(record.visitors),
    }));
  }, [filteredRecords]);

  const { chartData, keyMap, config } = React.useMemo(() => {
    if (!stackRecords.length) {
      return { chartData: [], keyMap: [], config: {} };
    }

    const { keys, series, labelMap } = buildStackSeries(
      stackRecords,
      regionAccessors,
      {
        months: monthsLimit,
        periodGrouping,
        labelForKey: labelForRegion,
      },
    );

    return buildStackedChartView({
      keys,
      labelMap,
      series,
      periodFormatter: getPeriodFormatter(periodGrouping),
    });
  }, [stackRecords, monthsLimit, periodGrouping]);

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
          options={PERIOD_GROUPING_OPTIONS}
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
