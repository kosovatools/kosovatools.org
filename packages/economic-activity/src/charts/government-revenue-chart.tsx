"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatCurrencyCompact } from "@workspace/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { HierarchicalMultiSelect } from "@workspace/ui/custom-components/hierarchical-multi-select";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import {
  buildUiHierarchy,
  type GovernmentRevenueDatasetView,
} from "@workspace/kas-data";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
import { useDatasetTimeControls } from "@workspace/ui/lib/use-dataset-time-controls";

const DEFAULT_TOP_CATEGORIES = 8;
const CHART_MARGIN = { top: 24, right: 32, bottom: 16, left: 16 };

function collectLeaves(
  nodes: ReturnType<typeof buildUiHierarchy>["nodes"],
): string[] {
  const leaves: string[] = [];
  const walk = (list: ReturnType<typeof buildUiHierarchy>["nodes"]) => {
    for (const node of list) {
      if (node.children && node.children.length) {
        walk(node.children);
      } else {
        leaves.push(node.id);
      }
    }
  };
  walk(nodes);
  return leaves;
}

function expandSelectionToLeaves(
  nodes: ReturnType<typeof buildUiHierarchy>["nodes"],
  selected: string[],
): string[] {
  const selectedSet = new Set(selected);
  const leaves: string[] = [];
  const walk = (list: ReturnType<typeof buildUiHierarchy>["nodes"]) => {
    for (const node of list) {
      const hasChildren = node.children && node.children.length;
      if (hasChildren) {
        if (selectedSet.has(node.id)) {
          leaves.push(
            ...collectLeaves(
              node.children as ReturnType<typeof buildUiHierarchy>["nodes"],
            ),
          );
        } else {
          walk(node.children as ReturnType<typeof buildUiHierarchy>["nodes"]);
        }
      } else if (selectedSet.has(node.id)) {
        leaves.push(node.id);
      }
    }
  };
  walk(nodes);
  return Array.from(new Set(leaves));
}

export function GovernmentRevenueStackedChart({
  dataset,
  timelineEvents,
}: {
  dataset: GovernmentRevenueDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const { nodes: hierarchyNodes, labelMap } = React.useMemo(
    () =>
      buildUiHierarchy(
        dataset.meta.dimension_hierarchies?.category,
        dataset.meta.dimensions.category,
      ),
    [
      dataset.meta.dimension_hierarchies?.category,
      dataset.meta.dimensions.category,
    ],
  );

  const leaves = React.useMemo(
    () => collectLeaves(hierarchyNodes),
    [hierarchyNodes],
  );

  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
  } = useDatasetTimeControls(dataset);

  const defaultSelectedCategories = React.useMemo(
    () =>
      (leaves.length
        ? leaves
        : dataset.meta.dimensions.category.map((option) => option.key)
      ).slice(0, DEFAULT_TOP_CATEGORIES),
    [dataset.meta.dimensions.category, leaves],
  );

  const [selectedCategoryNodes, setSelectedCategoryNodes] = React.useState<
    string[]
  >(defaultSelectedCategories);

  const selectedCategoryLeaves = React.useMemo(() => {
    const expandedSelection = expandSelectionToLeaves(
      hierarchyNodes,
      selectedCategoryNodes,
    );
    return expandedSelection;
  }, [hierarchyNodes, selectedCategoryNodes]);

  const stackResult = React.useMemo(() => {
    return datasetView.viewAsStack({
      keyAccessor: (record) => record.category,
      valueAccessor: (record) => record.amount_eur,
      dimension: "category",
      dimensionOptions: dataset.meta.dimensions.category.map((option) => ({
        key: option.key,
        label: labelMap[option.key] ?? option.label,
      })),
      selectedKeys: selectedCategoryLeaves,
      includeOther: false,
      periodGrouping,
    });
  }, [
    dataset.meta.dimensions.category,
    datasetView,
    labelMap,
    periodGrouping,
    selectedCategoryLeaves,
  ]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult),
    [stackResult],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
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
      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <HierarchicalMultiSelect
          nodes={hierarchyNodes}
          selectedIds={selectedCategoryNodes}
          onSelectionChange={setSelectedCategoryNodes}
          title="Zgjedh kategoritë e të hyrave"
          scrollContainerClassName="max-h-[420px] border rounded-md"
          showCollapseAllButton
          selectionBehavior="toggle-children"
          minSelected={1}
        />
        <ChartContainer
          config={chartConfig}
          className="aspect-[1/1.4] sm:aspect-video"
          title="Të hyrat tremujore"
        >
          <AreaChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tickFormatter={(value) => periodFormatter(value as string)}
              tickMargin={8}
              minTickGap={24}
              axisLine={false}
            />
            <YAxis
              width="auto"
              tickFormatter={(value) => formatCurrencyCompact(value as number)}
              axisLine={false}
            />
            <TimelineEventMarkers
              data={chartData}
              grouping={periodGrouping}
              enabled={timelineEvents?.enabled}
              includeCategories={timelineEvents?.includeCategories}
            />
            <ChartTooltip
              labelFormatter={periodFormatter}
              valueFormatter={(value) =>
                formatCurrencyCompact(value as number | null)
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {chartKeys.map((key) => {
              const label = chartConfig[key]?.label;
              const seriesName = typeof label === "string" ? label : key;
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="gov-finance-rev"
                  stroke={`var(--color-${key})`}
                  fill={`var(--color-${key})`}
                  fillOpacity={0.25}
                  name={seriesName}
                />
              );
            })}
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
