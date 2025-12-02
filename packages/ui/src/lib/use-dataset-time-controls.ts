"use client";

import * as React from "react";

import {
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodFormatter,
  type PeriodGrouping,
  type PeriodGroupingOption,
  type DatasetTimeMetadata,
  type TimeRangeOption,
} from "@workspace/utils";
import type { GenericDataset, DatasetView } from "@workspace/data";

type useDeriveChartControlsOptions<TDataset extends GenericDataset> = {
  initialGrouping?: PeriodGrouping;
  initialTimeRange?: TimeRangeOption;
  initialMetric?: DatasetView<TDataset>["meta"]["metrics"][number];
  includeSeasonal?: boolean;
};

export function useDeriveChartControls<TDataset extends GenericDataset>(
  dataset: DatasetView<TDataset>,
  {
    initialGrouping = "yearly",
    initialTimeRange = null,
    initialMetric,
    includeSeasonal = false,
  }: useDeriveChartControlsOptions<TDataset> = {},
) {
  const periodGroupingOptions = React.useMemo<
    ReadonlyArray<PeriodGroupingOption>
  >(
    () =>
      getPeriodGroupingOptions(dataset.meta.time.granularity, includeSeasonal),
    [dataset.meta.time.granularity, includeSeasonal],
  );

  const timeRangeOptions = React.useMemo(
    () =>
      limitTimeRangeOptions({
        granularity: dataset.meta.time
          .granularity as DatasetTimeMetadata["granularity"],
        count: dataset.meta.time.count,
      }),
    [dataset.meta.time],
  );

  const [periodGrouping, setPeriodGrouping] =
    React.useState<PeriodGrouping>(initialGrouping);
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeOption>(initialTimeRange);

  const datasetView = React.useMemo(
    () => dataset.limit(timeRange),
    [dataset, timeRange],
  );

  const periodFormatter: PeriodFormatter = React.useMemo(
    () => getPeriodFormatter(periodGrouping),
    [periodGrouping],
  );

  const metricOptions = React.useMemo<DatasetView<TDataset>["meta"]["fields"]>(
    () => dataset.meta.fields,
    [dataset.meta.fields],
  );

  const [metric, setMetric] = React.useState<
    DatasetView<TDataset>["meta"]["metrics"][number]
  >(
    initialMetric ??
      (metricOptions[0]
        ?.key as DatasetView<TDataset>["meta"]["metrics"][number]),
  );

  return {
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
  };
}
