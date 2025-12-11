"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { PropertyPriceIndexDataset } from "@kosovatools/data";
import { formatNumber, type DatasetView } from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  COMMON_CHART_MARGINS,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { useDeriveChartControls } from "@workspace/ui/lib/use-dataset-time-controls";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";

type Props = {
  dataset: DatasetView<PropertyPriceIndexDataset>;
  timelineEvents?: TimelineEventMarkerControls;
};

export function PropertyPriceIndexChart({ dataset, timelineEvents }: Props) {
  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
  } = useDeriveChartControls(dataset, {
    initialGrouping: dataset.meta.time.granularity,
  });

  const chartConfig = useMemo<ChartConfig>(
    () =>
      addThemeToChartConfig({
        index: {
          label:
            dataset.meta.fields.find((field) => field.key === "index")?.label ??
            "Indeks",
        },
      }),
    [dataset.meta.fields],
  );

  const chartData = useMemo(
    () =>
      datasetView
        .aggregate({
          grouping: periodGrouping,
          fields: [{ key: "index", mode: "average" }],
        })
        .sort((a, b) => a.period.localeCompare(b.period)),
    [datasetView, periodGrouping],
  );

  const formatIndexValue = (value: number | null | undefined) =>
    formatNumber(
      value,
      { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      { fallback: "—" },
    );

  return (
    <ChartScaffolding
      actions={
        <>
          <OptionSelector
            label="Grupimi"
            value={periodGrouping}
            onChange={setPeriodGrouping}
            options={periodGroupingOptions}
          />
          <OptionSelector
            label="Periudha"
            value={timeRange}
            onChange={setTimeRange}
            options={timeRangeOptions}
          />
        </>
      }
    >
      <ChartContainer
        config={chartConfig}
        className="w-full aspect-[1/1.5] sm:aspect-video"
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={COMMON_CHART_MARGINS}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
            tickFormatter={(value) => periodFormatter(String(value))}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickMargin={10}
            width="auto"
            tickFormatter={(value) => formatIndexValue(value as number | null)}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) => formatIndexValue(value as number | null)}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            isAnimationActive={false}
            dataKey="index"
            type="monotone"
            stroke="var(--color-index)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
