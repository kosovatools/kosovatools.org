"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { CpiDataset, ToDatasetView } from "@workspace/kas-data";
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
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { addThemeToChartConfig } from "@workspace/ui/lib/chart-palette";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { HierarchicalMultiSelect } from "@workspace/ui/custom-components/hierarchical-multi-select";
import {
  CPI_DEFAULT_GROUP_CODE,
  buildCpiHierarchicalNodes,
  cpiGroupNodesByCode,
} from "./cpi-groups";

const DEFAULT_TIME_RANGE = 36;

const METRIC_OPTIONS = [
  {
    key: "index",
    label: "Indeksi (2015 = 100)",
    axisFormatter: (value: number) =>
      formatNumber(
        value,
        { minimumFractionDigits: 1, maximumFractionDigits: 1 },
        { fallback: "—" },
      ),
  },
  {
    key: "change",
    label: "Ndryshimi mujor (%)",
    axisFormatter: (value: number) => formatSignedPercent(value),
  },
] as const;

type MetricKey = (typeof METRIC_OPTIONS)[number]["key"];
type ChartRow = { period: string } & Record<string, number | string | null>;

const hierarchicalNodes = buildCpiHierarchicalNodes();

export function CpiChart({ dataset }: { dataset: ToDatasetView<CpiDataset> }) {
  const PERIOD_GROUPING_OPTIONS = getPeriodGroupingOptions(
    dataset.meta.time.granularity,
  );
  const TIME_RANGE_OPTIONS = limitTimeRangeOptions(dataset.meta.time);
  const [periodGrouping, setPeriodGrouping] = useState<PeriodGrouping>(
    dataset.meta.time.granularity,
  );
  const [timeRange, setTimeRange] =
    useState<TimeRangeOption>(DEFAULT_TIME_RANGE);
  const [metric, setMetric] = useState<MetricKey>("index");
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
    if (!datasetView.records.length) {
      return { chartData: [], chartConfig: {} as ChartConfig };
    }

    const uniqueGroups = Array.from(
      new Set(
        selectedGroups.filter((code) => Boolean(cpiGroupNodesByCode[code])),
      ),
    );
    if (!uniqueGroups.length) {
      return { chartData: [], chartConfig: {} as ChartConfig };
    }

    const aggregatedSeries = uniqueGroups
      .map((code) => ({
        code,
        label: cpiGroupNodesByCode[code]?.name ?? code,
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
              mode: "compoundChange",
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

  const metricConfig = METRIC_OPTIONS.find((option) => option.key === metric)!;
  const axisFormatter = metricConfig.axisFormatter;

  // Helper function for XAxis tick formatting
  const formatPeriodTick = (value: string) => periodFormatter(value);
  return (
    <div className="space-y-6">
      <HierarchicalMultiSelect
        title="Grupet COICOP"
        nodes={hierarchicalNodes}
        selectedIds={selectedGroups}
        defaultExpandedIds={[CPI_DEFAULT_GROUP_CODE]}
        onSelectionChange={(ids) =>
          setSelectedGroups(ids.length ? ids : [CPI_DEFAULT_GROUP_CODE])
        }
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OptionSelector<MetricKey>
            label="Metrika"
            value={metric}
            onChange={setMetric}
            options={METRIC_OPTIONS}
          />
          <OptionSelector<PeriodGrouping>
            label="Grupimi"
            value={periodGrouping}
            onChange={setPeriodGrouping}
            options={PERIOD_GROUPING_OPTIONS}
          />
          <OptionSelector<TimeRangeOption>
            label="Periudha"
            value={timeRange}
            onChange={setTimeRange}
            options={TIME_RANGE_OPTIONS}
          />
        </div>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
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
              tickMargin={10}
              tickFormatter={(value) => axisFormatter(value as number)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
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
  );
}
