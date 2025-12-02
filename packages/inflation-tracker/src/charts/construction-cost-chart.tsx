"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { formatNumber } from "@workspace/utils";
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
import { HierarchicalMultiSelect } from "@workspace/ui/custom-components/hierarchical-multi-select";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { ChartScaffolding } from "@workspace/ui/custom-components/chart-scaffolding";

import {
  CONSTRUCTION_DEFAULT_CATEGORY_CODES,
  CONSTRUCTION_DEFAULT_EXPANDED_CODES,
} from "../construction-cost-groups";
import {
  buildUiHierarchy,
  ConstructionCostIndexDataset,
  DatasetView,
} from "@workspace/data";

type ChartRow = { period: string } & Record<string, number | string | null>;

type Props = {
  dataset: DatasetView<ConstructionCostIndexDataset>;
  timelineEvents?: TimelineEventMarkerControls;
};
export function ConstructionCostIndexChart({ dataset, timelineEvents }: Props) {
  const { labelMap, nodes: hierarchicalNodes } = useMemo(
    () =>
      buildUiHierarchy(
        dataset.meta.dimension_hierarchies?.cost_category,
        dataset.meta.dimensions.cost_category,
      ),
    [dataset],
  );

  const labelMapById = useMemo(
    () => new Map(Object.entries(labelMap)),
    [labelMap],
  );

  const defaultSelection = useMemo(() => {
    const defaults = CONSTRUCTION_DEFAULT_CATEGORY_CODES.filter((key) =>
      labelMapById.has(key),
    );
    if (defaults.length) return defaults;
    if (dataset.meta.dimensions.cost_category.length)
      return [dataset.meta.dimensions.cost_category[0]!.key];
    return [];
  }, [dataset.meta.dimensions.cost_category, labelMapById]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    () => defaultSelection,
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

  const { chartData, chartConfig } = useMemo(() => {
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
      acc[key] = { label: labelMapById.get(key) ?? key };
      return acc;
    }, {} as ChartConfig);

    return {
      chartData: sortedRows,
      chartConfig: addThemeToChartConfig(config),
    };
  }, [datasetView.records, labelMapById, selectedCategories]);

  const formatAxisValue = (value: number | null | undefined) =>
    formatNumber(
      value,
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      },
      { fallback: "—" },
    );

  return (
    <ChartScaffolding
      actions={
        <div className="flex justify-end w-full">
          <OptionSelector
            label="Periudha"
            value={timeRange}
            onChange={setTimeRange}
            options={timeRangeOptions}
          />
        </div>
      }
      selectors={
        <HierarchicalMultiSelect
          title="Kategoritë e kostove"
          nodes={hierarchicalNodes}
          selectedIds={selectedCategories}
          defaultExpandedIds={[...CONSTRUCTION_DEFAULT_EXPANDED_CODES]}
          onSelectionChange={setSelectedCategories}
          emptyMessage="Nuk ka kategori të disponueshme."
          selectionBehavior="toggle-children"
          minSelected={1}
          scrollContainerClassName="max-h-[420px] border rounded-md"
        />
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
            tickFormatter={(value) => formatAxisValue(value as number | null)}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={dataset.meta.time.granularity}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
          <ChartTooltip
            valueFormatter={(value) => formatAxisValue(value as number | null)}
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
