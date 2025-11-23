"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { CpiDatasetView } from "@workspace/kas-data";
import { formatNumber, formatSignedPercent } from "@workspace/utils";
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
  CPI_DEFAULT_GROUP_CODE,
  buildCpiHierarchicalNodes,
  cpiGroupLabelsByCode,
} from "../cpi-groups";

const METRIC_FORMATTER = {
  index: (value: number | null) =>
    formatNumber(
      value,
      { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      { fallback: "—" },
    ),
  change: (value: number | null) => formatSignedPercent(value),
} as const;

type ChartRow = { period: string } & Record<string, number | string | null>;
const hierarchicalNodes = buildCpiHierarchicalNodes();

export function CpiChart({
  dataset,
  timelineEvents,
}: {
  dataset: CpiDatasetView;
  timelineEvents?: TimelineEventMarkerControls;
}) {
  const {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
    metric,
    setMetric,
    metricOptions,
  } = useDeriveChartControls(dataset, { initialMetric: "index" });
  const [selectedGroups, setSelectedGroups] = useState<string[]>([
    CPI_DEFAULT_GROUP_CODE,
  ]);

  const { chartData, chartConfig } = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(selectedGroups.filter((code) => cpiGroupLabelsByCode[code])),
    );
    if (!uniqueGroups.length) {
      return { chartData: [], chartConfig: {} as ChartConfig };
    }

    const aggregatedSeries = uniqueGroups
      .map((code) => ({
        code,
        label: cpiGroupLabelsByCode[code] ?? code,
        rows: datasetView.aggregate({
          grouping: periodGrouping,
          filter: (record) => record.group === code,
          fields: [
            { key: "index", mode: "average" },
            { key: "change", mode: "rate" },
          ],
        }),
      }))
      .filter((entry) => entry.rows.length > 0);

    if (!aggregatedSeries.length) {
      return { chartData: [], chartConfig: {} as ChartConfig };
    }

    const periodSet = new Set<string>();
    aggregatedSeries.forEach((series) => {
      series.rows.forEach((row) => periodSet.add(row.period));
    });

    const sortedPeriods = Array.from(periodSet).sort();

    const chartRows = sortedPeriods.map<ChartRow>((period) => {
      const row: ChartRow = { period };
      aggregatedSeries.forEach((series) => {
        const match = series.rows.find((entry) => entry.period === period);
        row[series.code] = match?.[metric] ?? null;
      });
      return row;
    });

    const dynamicConfig = aggregatedSeries.reduce<ChartConfig>(
      (acc, series) => {
        acc[series.code] = { label: series.label };
        return acc;
      },
      {} as ChartConfig,
    );

    return {
      chartData: chartRows,
      chartConfig: addThemeToChartConfig(dynamicConfig),
    };
  }, [datasetView, periodGrouping, metric, selectedGroups]);

  const axisFormatter = METRIC_FORMATTER[metric];

  // Helper function for XAxis tick formatting
  const formatPeriodTick = (value: string) => periodFormatter(value);
  return (
    <ChartScaffolding
      actions={
        <>
          <OptionSelector
            label="Metrika"
            value={metric}
            onChange={setMetric}
            options={metricOptions}
          />
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
      selectors={
        <HierarchicalMultiSelect
          title="Grupet COICOP"
          nodes={hierarchicalNodes}
          selectedIds={selectedGroups}
          defaultExpandedIds={[CPI_DEFAULT_GROUP_CODE]}
          onSelectionChange={(ids) => setSelectedGroups(ids)}
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
            tickFormatter={formatPeriodTick}
            minTickGap={30}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickMargin={10}
            tickFormatter={(value) => axisFormatter(value as number | null)}
          />
          <TimelineEventMarkers
            data={chartData}
            grouping={periodGrouping}
            enabled={timelineEvents?.enabled}
            includeCategories={timelineEvents?.includeCategories}
          />
          <ChartTooltip
            labelFormatter={periodFormatter}
            valueFormatter={(value) => axisFormatter(value as number | null)}
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
            />
          ))}
        </LineChart>
      </ChartContainer>
    </ChartScaffolding>
  );
}
