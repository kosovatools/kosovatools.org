"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { CpiAveragePriceDatasetView } from "@workspace/kas-data";
import {
  formatCurrency,
  getPeriodFormatter,
  limitTimeRangeOptions,
  type TimeRangeOption,
} from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { MultiSelectCombobox } from "../components/multi-select-combobox";

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

  const timeRangeOptions = useMemo(
    () => limitTimeRangeOptions(dataset.meta.time),
    [dataset.meta.time],
  );

  const [timeRange, setTimeRange] = useState<TimeRangeOption>(null);

  const datasetView = useMemo(
    () => dataset.limit(timeRange),
    [dataset, timeRange],
  );

  const periodFormatter = useMemo(
    () => getPeriodFormatter(dataset.meta.time.granularity),
    [dataset.meta.time.granularity],
  );

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
    <div className="space-y-6">
      <MultiSelectCombobox
        description={`Krahaso deri në ${MAX_SELECTED_ARTICLES} artikuj ushqimorë dhe shërbime për të parë trendet mesatare të çmimeve vjetore.`}
        selectedValues={selectedArticles}
        onChange={setSelectedArticles}
        options={comboboxOptions}
        maxSelected={MAX_SELECTED_ARTICLES}
        addPlaceholder="Shto një artikull..."
        maxSelectedPlaceholder="Maksimumi i arritur"
        searchPlaceholder="Kërko artikull..."
        emptyMessage="Asnjë artikull nuk përputhet."
        emptySelectionMessage="Zgjedh të paktën një artikull për të shfaqur grafikun."
      />
      <div className="space-y-2">
        <OptionSelector
          label="Periudha"
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
        />
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-[1/1.5] sm:aspect-video"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 10, bottom: 0, left: 0, right: 0 }}
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
              width={80}
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
      </div>
    </div>
  );
}
