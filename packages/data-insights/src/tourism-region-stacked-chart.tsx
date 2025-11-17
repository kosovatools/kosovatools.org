"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { tourismRegion, type TourismRegionMeta } from "@workspace/kas-data";
import {
  formatCount,
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodGrouping,
  type PeriodGroupingOption,
  type TimeRangeOption,
} from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";

const DEFAULT_GROUP_LABEL = "Total";
const CHART_MARGIN = { top: 32, right: 32, bottom: 16, left: 16 };

const PERIOD_GROUPING_OPTIONS: ReadonlyArray<PeriodGroupingOption> =
  getPeriodGroupingOptions(tourismRegion.meta.time.granularity);
const TIME_RANGE_OPTIONS = limitTimeRangeOptions(tourismRegion.meta.time);
const DEFAULT_TIME_RANGE: TimeRangeOption = 24;

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

export function TourismRegionCharts() {
  const [group, setGroup] =
    React.useState<
      TourismRegionMeta["dimensions"]["visitor_group"][number]["key"]
    >("total");
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    tourismRegion.meta.time.granularity,
  );
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  React.useEffect(() => {
    if (
      !tourismRegion.meta.dimensions.visitor_group.some(
        (option) => option.key === group,
      )
    ) {
      setGroup("total");
    }
  }, [group]);

  const datasetView = React.useMemo(
    () => tourismRegion.limit(timeRange),
    [timeRange],
  );

  const stackResult = React.useMemo(() => {
    if (!datasetView.records.length) {
      return null;
    }

    return datasetView.viewAsStack({
      keyAccessor: (record) => record.region,
      valueAccessor: (record) =>
        record.visitor_group === group ? record.visitors : null,
      dimension: "region",
      periodGrouping,
    });
  }, [datasetView, group, periodGrouping]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  const latestSummary = React.useMemo(() => {
    if (!chartData.length || !chartKeys.length) {
      return null;
    }

    const lastRow = chartData.at(-1);
    if (!lastRow) {
      return null;
    }

    const total = chartKeys.reduce(
      (sum, key) => sum + (Number(lastRow[key]) || 0),
      0,
    );

    return {
      periodLabel: periodFormatter(lastRow.period),
      total,
    };
  }, [chartData, chartKeys, periodFormatter]);

  if (!chartData.length || !chartKeys.length) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për rajonet e turizmit.
        </div>
      </ChartContainer>
    );
  }

  const groupLabel =
    tourismRegion.meta.dimensions.visitor_group.find(
      (option) => option.key === group,
    )?.label ??
    tourismRegion.meta.dimensions.visitor_group[0]?.label ??
    DEFAULT_GROUP_LABEL;
  const groupLabelText = getVisitorGroupLabelText(groupLabel);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <OptionSelector
          value={group}
          onChange={(value) => setGroup(value)}
          options={tourismRegion.meta.dimensions.visitor_group}
          label="Grupi i vizitorëve"
        />
        <OptionSelector<PeriodGrouping>
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={PERIOD_GROUPING_OPTIONS}
          label="Perioda"
        />
        <OptionSelector<TimeRangeOption>
          value={timeRange}
          onChange={setTimeRange}
          options={TIME_RANGE_OPTIONS}
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

      <ChartContainer config={chartConfig}>
        <AreaChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickFormatter={(value) => periodFormatter(String(value))}
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={(value) => formatCount(value as number)}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => {
            const label = chartConfig[key]?.label;
            const seriesName = typeof label === "string" ? label : key;

            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="tourism-regions"
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.2}
                name={seriesName}
              />
            );
          })}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
