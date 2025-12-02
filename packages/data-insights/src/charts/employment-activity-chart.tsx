"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { type EmploymentActivityGenderDatasetView } from "@workspace/data";
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

export function EmploymentActivityChart({
  dataset,
  top = 8,
  timelineEvents,
}: {
  dataset: EmploymentActivityGenderDatasetView;
  top?: number;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const [gender, setGender] =
    React.useState<
      EmploymentActivityGenderDatasetView["meta"]["dimensions"]["gender"][number]["key"]
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

  const stackResult = React.useMemo(() => {
    return datasetView.viewAsStack({
      valueAccessor: (record) =>
        record.gender === gender ? record.employment : null,
      dimension: "activity",
      periodGrouping,
      groupedValueMode: "latest",
      dropIncompletePeriods: true,
      preserveLatestIncomplete: true,
      includeOther: true,
      top,
    });
  }, [datasetView, gender, periodGrouping, top]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  return (
    <ChartScaffolding
      actions={
        <>
          <OptionSelector
            value={gender}
            onChange={(value) => setGender(value)}
            options={dataset.meta.dimensions.gender}
            label="Gjinia"
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
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.5] sm:aspect-video"
      >
        <AreaChart data={chartData} margin={COMMON_CHART_MARGINS}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickFormatter={(value) => periodFormatter(String(value))}
            tickMargin={8}
            minTickGap={20}
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
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) => formatCount(value as number | null)}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {chartKeys.map((key) => (
            <Area
              isAnimationActive={false}
              key={key}
              type="monotone"
              dataKey={key}
              stackId="employment-activity"
              stroke={`var(--color-${key})`}
              fill={`var(--color-${key})`}
              fillOpacity={0.2}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
