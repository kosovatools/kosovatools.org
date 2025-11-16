"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { cpiDataset } from "@workspace/kas-data";
import {
  formatNumber,
  formatSignedPercent,
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodGrouping,
  type PeriodGroupingOption,
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

const PERIOD_GROUPING_OPTIONS: ReadonlyArray<PeriodGroupingOption> =
  getPeriodGroupingOptions(cpiDataset.meta.time.granularity);
const TIME_RANGE_OPTIONS = limitTimeRangeOptions(cpiDataset.meta.time);
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

export function InflationTracker() {
  const [periodGrouping, setPeriodGrouping] = useState<PeriodGrouping>(
    cpiDataset.meta.time.granularity,
  );
  const [timeRange, setTimeRange] =
    useState<TimeRangeOption>(DEFAULT_TIME_RANGE);
  const [metric, setMetric] = useState<MetricKey>("index");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([
    CPI_DEFAULT_GROUP_CODE,
  ]);

  const datasetView = useMemo(() => {
    return cpiDataset.limit(timeRange);
  }, [timeRange]);

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

  if (!chartData.length || !Object.keys(chartConfig).length) {
    return (
      <ChartContainer config={chartConfig} className="h-[360px] w-full">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nuk ka të dhëna për t'u shfaqur.
        </div>
      </ChartContainer>
    );
  }

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
            onChange={(value) => setPeriodGrouping(value)}
            options={PERIOD_GROUPING_OPTIONS}
          />
          <OptionSelector<TimeRangeOption>
            label="Intervali"
            value={timeRange}
            onChange={(value) => setTimeRange(value)}
            options={TIME_RANGE_OPTIONS}
          />
        </div>
        <ChartContainer config={chartConfig} className="h-[420px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 32, right: 32, bottom: 16, left: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="period"
              tickFormatter={(value) => periodFormatter(value as string)}
              tickMargin={8}
              minTickGap={24}
              axisLine={false}
            />
            <YAxis
              width="auto"
              tickFormatter={(value) => axisFormatter(value as number)}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => periodFormatter(value as string)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {Object.keys(chartConfig).map((code) => {
              const label = chartConfig[code]?.label;
              const seriesName = typeof label === "string" ? label : code;

              return (
                <Line
                  key={code}
                  type="monotone"
                  dataKey={code}
                  stroke={`var(--color-${code})`}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name={seriesName}
                />
              );
            })}
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
