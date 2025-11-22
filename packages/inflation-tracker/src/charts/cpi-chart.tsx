"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { CpiDatasetView } from "@workspace/kas-data";
import {
  formatNumber,
  formatSignedPercent,
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodGrouping,
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
import { HierarchicalMultiSelect } from "@workspace/ui/custom-components/hierarchical-multi-select";
import {
  TimelineEventMarkers,
  type TimelineEventMarkerControls,
} from "@workspace/ui/custom-components/timeline-event-markers";
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
  const PERIOD_GROUPING_OPTIONS = getPeriodGroupingOptions(
    dataset.meta.time.granularity,
  );
  const TIME_RANGE_OPTIONS = limitTimeRangeOptions(dataset.meta.time);
  const [periodGrouping, setPeriodGrouping] =
    useState<PeriodGrouping>("yearly");
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(null);
  const [metric, setMetric] =
    useState<CpiDatasetView["meta"]["metrics"][number]>("index");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([
    CPI_DEFAULT_GROUP_CODE,
  ]);

  const datasetView = useMemo(() => {
    return dataset.limit(timeRange);
  }, [dataset, timeRange]);

  const periodFormatter = useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

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
            {
              key: "index",
              valueAccessor: (record) => record.index,
              mode: "average",
            },
            {
              key: "change",
              valueAccessor: (record) => record.change,
              mode: "rate",
            },
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
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
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
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <OptionSelector
              label="Metrika"
              value={metric}
              onChange={setMetric}
              options={dataset.meta.fields}
            />
            <OptionSelector
              label="Grupimi"
              value={periodGrouping}
              onChange={setPeriodGrouping}
              options={PERIOD_GROUPING_OPTIONS}
            />
            <OptionSelector
              label="Periudha"
              value={timeRange}
              onChange={setTimeRange}
              options={TIME_RANGE_OPTIONS}
            />
          </div>
          <ChartContainer
            config={chartConfig}
            className="w-full aspect-[1/1.5] sm:aspect-video"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 0,
                right: 0,
                top: 10,
                bottom: 0,
              }}
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
                valueFormatter={(value) =>
                  axisFormatter(value as number | null)
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
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
