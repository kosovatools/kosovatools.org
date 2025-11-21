"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  formatCurrencyCompact,
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
} from "@workspace/ui/components/chart";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import {
  StackedKeySelector,
  createInitialStackedKeySelection,
  type StackedKeySelectionState,
} from "@workspace/ui/custom-components/stacked-key-selector";
import { buildStackedChartData } from "@workspace/ui/lib/stacked-chart-helpers";
import {
  createDataset,
  type Dataset,
  type GdpByActivityDatasetView,
  type GdpByActivityMeta,
  type GdpByActivityMetric,
  type GdpByActivityRecord,
} from "@workspace/kas-data";

const DEFAULT_TOP_ACTIVITIES = 5;
const CHART_MARGIN = { top: 24, right: 32, bottom: 16, left: 16 };

export function GdpActivityStackedChart({
  dataset,
}: {
  dataset: GdpByActivityDatasetView;
}) {
  const baseDataset = React.useMemo(
    () =>
      createDataset({
        meta: dataset.meta,
        records: dataset.records.filter(
          (record) =>
            !(dataset.meta.aggregates ?? []).includes(record.activity),
        ),
      } satisfies Dataset<GdpByActivityRecord, GdpByActivityMeta>),
    [dataset.meta, dataset.records],
  );

  const PERIOD_GROUPING_OPTIONS: ReadonlyArray<PeriodGroupingOption> =
    getPeriodGroupingOptions(baseDataset.meta.time.granularity);
  const TIME_RANGE_OPTIONS = limitTimeRangeOptions(baseDataset.meta.time);

  const [metricKey, setMetricKey] =
    React.useState<GdpByActivityMetric>("nominal_eur");
  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    baseDataset.meta.time.granularity,
  );
  const [timeRange, setTimeRange] = React.useState<TimeRangeOption>(
    TIME_RANGE_OPTIONS[4]?.key ?? null,
  );

  const datasetView = React.useMemo(
    () => baseDataset.limit(timeRange),
    [baseDataset, timeRange],
  );

  const totals = React.useMemo(
    () =>
      datasetView.summarizeStack({
        keyAccessor: (record) => record.activity,
        valueAccessor: (record) => record[metricKey],
        dimension: "activity",
        dimensionOptions: dataset.meta.dimensions.activity,
      }),
    [dataset.meta.dimensions.activity, datasetView, metricKey],
  );

  const [selection, setSelection] = React.useState<StackedKeySelectionState>(
    () =>
      createInitialStackedKeySelection({
        totals,
        topCount: DEFAULT_TOP_ACTIVITIES,
        initialIncludeOther: true,
      }),
  );

  React.useEffect(() => {
    setSelection((current) =>
      createInitialStackedKeySelection({
        totals,
        topCount: DEFAULT_TOP_ACTIVITIES,
        initialIncludeOther: current.includeOther,
      }),
    );
  }, [totals]);

  const stackResult = React.useMemo(() => {
    if (!datasetView.records.length) return null;
    return datasetView.viewAsStack({
      keyAccessor: (record) => record.activity,
      valueAccessor: (record) => record[metricKey],
      dimension: "activity",
      dimensionOptions: dataset.meta.dimensions.activity,
      selectedKeys: selection.selectedKeys,
      excludedKeys: selection.excludedKeys,
      includeOther: selection.includeOther,
      periodGrouping,
    });
  }, [
    dataset.meta.dimensions.activity,
    datasetView,
    metricKey,
    periodGrouping,
    selection.excludedKeys,
    selection.includeOther,
    selection.selectedKeys,
  ]);

  const { chartKeys, chartData, chartConfig } = React.useMemo(
    () => buildStackedChartData(stackResult, { otherKey: "Të tjera" }),
    [stackResult],
  );

  const periodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <OptionSelector
          value={metricKey}
          onChange={(nextKey) => setMetricKey(nextKey)}
          options={dataset.meta.fields}
          label="Krahasimi"
        />
        <OptionSelector
          value={periodGrouping}
          onChange={(value) => setPeriodGrouping(value)}
          options={PERIOD_GROUPING_OPTIONS}
          label="Perioda"
        />
        <OptionSelector
          value={timeRange}
          onChange={setTimeRange}
          options={TIME_RANGE_OPTIONS}
          label="Intervali"
        />
        <StackedKeySelector
          totals={totals}
          selection={selection}
          onSelectionChange={setSelection}
          topCount={DEFAULT_TOP_ACTIVITIES}
          selectionLabel="Zgjedh aktivitetet"
          searchPlaceholder="Kërko sipas aktivitetit..."
        />
      </div>
      <ChartContainer
        config={chartConfig}
        className="aspect-[1/1.4] sm:aspect-video"
      >
        <AreaChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickFormatter={(value) => periodFormatter(String(value))}
            tickMargin={8}
            minTickGap={24}
            axisLine={false}
          />
          <YAxis
            width="auto"
            tickFormatter={(value) => formatCurrencyCompact(value as number)}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                valueFormatter={(value) =>
                  formatCurrencyCompact(value as number, { currency: "EUR" })
                }
              />
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
                stackId="gdp-activity"
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
  );
}
