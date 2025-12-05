"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatCount } from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";

import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
import { type DatasetView, type TourismRegionDataset } from "@workspace/data";

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

export function TourismRegionCharts({
  dataset,
  timelineEvents,
}: {
  dataset: DatasetView<TourismRegionDataset>;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const [group, setGroup] =
    React.useState<
      DatasetView<TourismRegionDataset>["meta"]["dimensions"]["visitor_group"][number]["key"]
    >("total");
  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
  } = useDeriveChartControls(dataset);

  React.useEffect(() => {
    if (
      !dataset.meta.dimensions.visitor_group.some(
        (option) => option.key === group,
      )
    ) {
      setGroup("total");
    }
  }, [group, dataset.meta.dimensions.visitor_group]);

  const stackResult = React.useMemo(() => {
    return datasetView.viewAsStack({
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

  const groupLabel =
    dataset.meta.dimensions.visitor_group.find((option) => option.key === group)
      ?.label ??
    dataset.meta.dimensions.visitor_group[0]?.label ??
    DEFAULT_GROUP_LABEL;
  const groupLabelText = getVisitorGroupLabelText(groupLabel);

  return (
    <ChartScaffolding
      actions={
        <>
          <OptionSelector
            value={group}
            onChange={(value) => setGroup(value)}
            options={dataset.meta.dimensions.visitor_group}
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
        </>
      }
    >
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
        <AreaChart data={chartData} margin={COMMON_CHART_MARGINS}>
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
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            {...timelineEvents}
          />
          <ChartTooltip
            valueFormatter={(value) => formatCount(value as number | null)}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => {
            const label = chartConfig[key]?.label;
            const seriesName = typeof label === "string" ? label : key;

            return (
              <Area
                isAnimationActive={false}
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
    </ChartScaffolding>
  );
}
