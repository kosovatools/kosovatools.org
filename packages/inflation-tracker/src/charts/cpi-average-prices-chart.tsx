"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { CpiAveragePriceDatasetView } from "@workspace/kas-data";
import { formatCurrency } from "@workspace/utils";
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
import { FilterableCombobox } from "@workspace/ui/custom-components/filterable-combobox";

const MAX_SELECTED_ARTICLES = 10;
const DEFAULT_VISIBLE_ARTICLES = 3;

type Props = {
  dataset: CpiAveragePriceDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
};

type ChartRow = { period: string } & Record<string, number | null | string>;

export function CpiAveragePricesChart({ dataset, timelineEvents }: Props) {
  const [selectedArticles, setSelectedArticles] = useState<string[]>(() =>
    dataset.meta.dimensions.article
      .slice(0, DEFAULT_VISIBLE_ARTICLES)
      .map((option) => option.key),
  );

  const {
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
  } = useDeriveChartControls(dataset, {
    initialGrouping: dataset.meta.time.granularity,
  });

  const comboboxOptions = useMemo(
    () =>
      dataset.meta.dimensions.article.map((option) => ({
        value: option.key,
        label: option.label,
        keywords: option.label.split(/\s+/g).map((word) => word.toLowerCase()),
      })),
    [dataset.meta.dimensions.article],
  );

  const labelMap = useMemo(
    () =>
      new Map<string, string>(comboboxOptions.map((o) => [o.value, o.label])),
    [comboboxOptions],
  );

  const { chartData, chartConfig } = useMemo(() => {
    if (!selectedArticles.length) {
      return { chartData: [], chartConfig: {} as ChartConfig };
    }

    const rowsByPeriod = new Map<string, ChartRow>();

    for (const record of datasetView.records) {
      let row = rowsByPeriod.get(record.period);
      if (!row) {
        row = { period: record.period } as ChartRow;
        rowsByPeriod.set(record.period, row);
      }
      row[record.article] =
        typeof record.price === "number" && Number.isFinite(record.price)
          ? record.price
          : null;
    }

    const sortedRows = Array.from(rowsByPeriod.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );

    const config = selectedArticles.reduce<ChartConfig>((acc, key) => {
      acc[key] = { label: labelMap.get(key) ?? key };
      return acc;
    }, {} as ChartConfig);

    return {
      chartData: sortedRows,
      chartConfig: addThemeToChartConfig(config),
    };
  }, [labelMap, datasetView, selectedArticles]);

  return (
    <ChartScaffolding
      actions={
        <>
          <OptionSelector
            label="Periudha"
            value={timeRange}
            onChange={setTimeRange}
            options={timeRangeOptions}
          />
          <FilterableCombobox
            multiple
            value={selectedArticles}
            onChange={setSelectedArticles}
            options={comboboxOptions}
            maxSelected={MAX_SELECTED_ARTICLES}
            minSelected={1}
            placeholder="Shto një artikull..."
            searchPlaceholder="Kërko artikull..."
            emptyMessage="Asnjë artikull nuk përputhet."
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
            tickFormatter={(value) => formatCurrency(value as number)}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={dataset.meta.time.granularity}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) => formatCurrency(value as number | null)}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {Object.keys(chartConfig).map((key) => (
            <Line
              isAnimationActive={false}
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
