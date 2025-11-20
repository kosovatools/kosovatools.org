"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ConstructionCostIndexDatasetView } from "@workspace/kas-data";
import {
  formatNumber,
  getPeriodFormatter,
  type PeriodFormatter,
} from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { HierarchicalMultiSelect } from "@workspace/ui/custom-components/hierarchical-multi-select";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import {
  buildConstructionCostNodes,
  CONSTRUCTION_DEFAULT_CATEGORY_CODES,
  CONSTRUCTION_DEFAULT_EXPANDED_CODES,
  constructionCostLabelMap,
} from "../construction-cost-groups";

type TimeRangeOption = number | null;

const DEFAULT_TIME_RANGE: TimeRangeOption = 12; // last 12 quarters (~3 years)
const TIME_RANGE_OPTIONS = [
  { key: 8, label: "2 vjet" },
  { key: 12, label: "3 vjet" },
  { key: 20, label: "5 vjet" },
  { key: null, label: "Gjithë seria" },
] as const satisfies ReadonlyArray<{ key: TimeRangeOption; label: string }>;

type ChartRow = { period: string } & Record<string, number | string | null>;

type Props = {
  dataset: ConstructionCostIndexDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
};

export function ConstructionCostIndexChart({ dataset, timelineEvents }: Props) {
  const labelMap = useMemo(
    () => new Map(Object.entries(constructionCostLabelMap)),
    [],
  );

  const hierarchicalNodes = useMemo(() => buildConstructionCostNodes(), []);

  const defaultSelection = useMemo(() => {
    const defaults = CONSTRUCTION_DEFAULT_CATEGORY_CODES.filter((key) =>
      labelMap.has(key),
    );
    if (defaults.length) return defaults;
    if (dataset.meta.dimensions.cost_category.length)
      return [dataset.meta.dimensions.cost_category[0]!.key];
    return [];
  }, [dataset.meta.dimensions.cost_category, labelMap]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    () => defaultSelection,
  );
  const [timeRange, setTimeRange] =
    useState<TimeRangeOption>(DEFAULT_TIME_RANGE);

  useEffect(() => {
    setSelectedCategories((prev) => {
      const filtered = prev.filter((key) => labelMap.has(key));
      if (filtered.length) return filtered;
      return defaultSelection;
    });
  }, [defaultSelection, labelMap]);

  const datasetView = useMemo(
    () => dataset.limit(timeRange),
    [dataset, timeRange],
  );

  const periodFormatter = useMemo<PeriodFormatter>(
    () => getPeriodFormatter(dataset.meta.time.granularity),
    [dataset.meta.time.granularity],
  );

  const { chartData, chartConfig } = useMemo(() => {
    if (!datasetView.records.length || !selectedCategories.length) {
      return { chartData: [], chartConfig: {} as ChartConfig };
    }

    const selectedSet = new Set(selectedCategories);
    const rowsByPeriod = new Map<string, ChartRow>();

    for (const record of datasetView.records) {
      if (!selectedSet.has(record.cost_category)) continue;
      let row = rowsByPeriod.get(record.period);
      if (!row) {
        row = { period: record.period } as ChartRow;
        rowsByPeriod.set(record.period, row);
      }
      row[record.cost_category] =
        typeof record.index === "number" && Number.isFinite(record.index)
          ? record.index
          : null;
    }

    const sortedRows = Array.from(rowsByPeriod.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );

    const config = selectedCategories.reduce<ChartConfig>((acc, key) => {
      acc[key] = { label: labelMap.get(key) ?? key };
      return acc;
    }, {} as ChartConfig);

    return {
      chartData: sortedRows,
      chartConfig: addThemeToChartConfig(config),
    };
  }, [datasetView, labelMap, selectedCategories]);

  const handleSelectionChange = (ids: string[]) => {
    const filtered = ids.filter((id) => labelMap.has(id));
    setSelectedCategories(filtered.length ? filtered : defaultSelection);
  };

  const hasData = chartData.length > 0 && Object.keys(chartConfig).length > 0;

  const formatAxisValue = (value: number) =>
    formatNumber(
      value,
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      },
      { fallback: "—" },
    );

  return (
    <div className="space-y-6">
      <HierarchicalMultiSelect
        title="Kategoritë e kostove"
        nodes={hierarchicalNodes}
        selectedIds={selectedCategories}
        defaultExpandedIds={[...CONSTRUCTION_DEFAULT_EXPANDED_CODES]}
        onSelectionChange={handleSelectionChange}
        emptyMessage="Nuk ka kategori të disponueshme."
      />
      <div className="space-y-2">
        <OptionSelector
          label="Periudha"
          value={timeRange}
          onChange={setTimeRange}
          options={TIME_RANGE_OPTIONS}
        />
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-[1/1.5] sm:aspect-video"
        >
          {hasData ? (
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
                tickFormatter={(value) => formatAxisValue(value as number)}
              />
              <TimelineEventMarkers
                data={chartData}
                grouping={dataset.meta.time.granularity}
                enabled={timelineEvents?.enabled}
                includeCategories={timelineEvents?.includeCategories}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    valueFormatter={(value) => formatAxisValue(value as number)}
                  />
                }
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
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nuk ka të dhëna për përzgjedhjet aktuale.
            </div>
          )}
        </ChartContainer>
      </div>
    </div>
  );
}
