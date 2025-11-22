"use client";

import * as React from "react";

import {
  getPeriodFormatter,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
  type PeriodFormatter,
  type PeriodGrouping,
  type PeriodGroupingOption,
  type TimeRangeOption,
} from "@workspace/utils";
import type { GenericDataset, DatasetView } from "@workspace/kas-data";

type UseDatasetTimeControlsOptions = {
  initialGrouping?: PeriodGrouping;
  initialTimeRange?: TimeRangeOption;
};

export function useDatasetTimeControls<TDataset extends GenericDataset>(
  dataset: DatasetView<TDataset>,
  {
    initialGrouping = "yearly",
    initialTimeRange = null,
  }: UseDatasetTimeControlsOptions = {},
) {
  const periodGroupingOptions = React.useMemo<
    ReadonlyArray<PeriodGroupingOption>
  >(
    () => getPeriodGroupingOptions(dataset.meta.time.granularity),
    [dataset.meta.time.granularity],
  );

  const timeRangeOptions = React.useMemo(
    () => limitTimeRangeOptions(dataset.meta.time),
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

  return {
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions,
    datasetView,
    periodFormatter,
  };
}
