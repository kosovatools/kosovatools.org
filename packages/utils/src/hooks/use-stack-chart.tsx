"use client";

import * as React from "react";
import type { StackBuildResult, StackTotal } from "../utils/stack";
import {
  buildStackChartSeries,
  summarizeStackChartTotals,
  getStackChartMetric,
  type StackChartSpec,
  type StackChartMetric,
  type StackChartBuildOptions,
} from "../charting/stacked-chart-spec";
import {
  DEFAULT_TIME_RANGE,
  DEFAULT_TIME_RANGE_OPTIONS,
  monthsFromRange,
  normalizeTimeRange,
  type TimeRangeDefinition,
  type TimeRangeOption,
} from "../utils/time-range";
import type { PeriodGrouping, PeriodGroupingOption } from "../utils/period";

export type UseStackChartStateOptions = {
  initialMetricKey?: string;
  initialPeriodGrouping?: PeriodGrouping;
  initialTimeRange?: TimeRangeOption;
};

export type UseStackChartStateResult<TRecord extends Record<string, unknown>> =
  {
    spec: StackChartSpec<TRecord>;
    metric: StackChartMetric<TRecord>;
    metricKey: string;
    setMetricKey: (key: string) => void;
    metricOptions: ReadonlyArray<StackChartMetric<TRecord>>;
    periodGrouping: PeriodGrouping;
    setPeriodGrouping: (grouping: PeriodGrouping) => void;
    periodGroupingOptions: ReadonlyArray<PeriodGroupingOption>;
    timeRange: TimeRangeOption;
    setTimeRange: (range: TimeRangeOption) => void;
    timeRangeOptions: ReadonlyArray<TimeRangeDefinition>;
    monthsLimit?: number;
    labelForDimension: (key: string) => string;
    buildSeries: (
      records: readonly TRecord[],
      options?: StackChartBuildOptions,
    ) => StackBuildResult<string>;
    summarizeTotals: (
      records: readonly TRecord[],
      options?: StackChartBuildOptions,
    ) => StackTotal<string>[];
  };

function ensureValidMetricKey<TRecord extends Record<string, unknown>>(
  spec: StackChartSpec<TRecord>,
  key: string | undefined,
): string {
  if (key && spec.metrics.some((entry) => entry.key === key)) {
    return key;
  }
  return spec.defaultMetricKey;
}

function ensureValidPeriodGrouping<TRecord extends Record<string, unknown>>(
  spec: StackChartSpec<TRecord>,
  grouping: PeriodGrouping | undefined,
): PeriodGrouping {
  if (grouping) return grouping;
  return spec.defaults.periodGrouping;
}

function ensureValidTimeRange<TRecord extends Record<string, unknown>>(
  spec: StackChartSpec<TRecord>,
  value: TimeRangeOption | undefined,
): TimeRangeOption {
  const fallback = spec.defaults.timeRange ?? DEFAULT_TIME_RANGE;
  return normalizeTimeRange(value, fallback);
}

export function useStackChartState<TRecord extends Record<string, unknown>>(
  spec: StackChartSpec<TRecord>,
  options: UseStackChartStateOptions = {},
): UseStackChartStateResult<TRecord> {
  const internalSpec = spec as unknown as StackChartSpec<
    Record<string, unknown>
  >;

  const [metricKey, setMetricKey] = React.useState<string>(() =>
    ensureValidMetricKey(spec, options.initialMetricKey),
  );

  const [periodGrouping, setPeriodGrouping] = React.useState<PeriodGrouping>(
    () => ensureValidPeriodGrouping(spec, options.initialPeriodGrouping),
  );

  const [timeRange, setTimeRange] = React.useState<TimeRangeOption>(() =>
    ensureValidTimeRange(spec, options.initialTimeRange),
  );

  React.useEffect(() => {
    setMetricKey((current) => ensureValidMetricKey(spec, current));
  }, [spec]);

  React.useEffect(() => {
    setPeriodGrouping((current) => ensureValidPeriodGrouping(spec, current));
  }, [spec]);

  React.useEffect(() => {
    setTimeRange((current) => ensureValidTimeRange(spec, current));
  }, [spec]);

  const metric = React.useMemo(
    () =>
      getStackChartMetric(internalSpec, metricKey) as StackChartMetric<TRecord>,
    [internalSpec, metricKey],
  );

  const monthsLimit = React.useMemo(
    () => monthsFromRange(timeRange),
    [timeRange],
  );

  const dimensionLabelMap = React.useMemo(
    () => spec.dimensionLabels ?? {},
    [spec.dimensionLabels],
  );

  const labelForDimension = React.useCallback(
    (dimensionKey: string) => dimensionLabelMap[dimensionKey] ?? dimensionKey,
    [dimensionLabelMap],
  );

  const mergedPeriodGroupingOptions = React.useMemo<
    ReadonlyArray<PeriodGroupingOption>
  >(() => spec.periodGroupingOptions ?? [], [spec.periodGroupingOptions]);

  const mergedTimeRangeOptions = React.useMemo<
    ReadonlyArray<TimeRangeDefinition>
  >(
    () => spec.timeRangeOptions ?? DEFAULT_TIME_RANGE_OPTIONS,
    [spec.timeRangeOptions],
  );

  const buildSeries = React.useCallback(
    (records: readonly TRecord[], options: StackChartBuildOptions = {}) => {
      const {
        metricKey: overrideMetric,
        periodGrouping: overrideGrouping,
        months,
        labelForKey,
        ...rest
      } = options;

      return buildStackChartSeries(
        internalSpec,
        records as ReadonlyArray<Record<string, unknown>>,
        {
          metricKey: overrideMetric ?? metric.key,
          periodGrouping: overrideGrouping ?? periodGrouping,
          months: months ?? monthsLimit,
          labelForKey: labelForKey ?? labelForDimension,
          ...rest,
        },
      );
    },
    [internalSpec, metric.key, periodGrouping, monthsLimit, labelForDimension],
  );

  const summarizeTotals = React.useCallback(
    (records: readonly TRecord[], options: StackChartBuildOptions = {}) => {
      const {
        metricKey: overrideMetric,
        periodGrouping: overrideGrouping,
        months,
        labelForKey,
        ...rest
      } = options;

      return summarizeStackChartTotals(
        internalSpec,
        records as ReadonlyArray<Record<string, unknown>>,
        {
          metricKey: overrideMetric ?? metric.key,
          periodGrouping: overrideGrouping ?? periodGrouping,
          months: months ?? monthsLimit,
          labelForKey: labelForKey ?? labelForDimension,
          ...rest,
        },
      );
    },
    [internalSpec, metric.key, periodGrouping, monthsLimit, labelForDimension],
  );

  return {
    spec,
    metric,
    metricKey,
    setMetricKey,
    metricOptions: spec.metrics,
    periodGrouping,
    setPeriodGrouping,
    periodGroupingOptions: mergedPeriodGroupingOptions,
    timeRange,
    setTimeRange,
    timeRangeOptions: mergedTimeRangeOptions,
    monthsLimit,
    labelForDimension,
    buildSeries,
    summarizeTotals,
  };
}
