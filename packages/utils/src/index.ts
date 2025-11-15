export * from "./formatters";
export { sanitizeValue, isFiniteNumber } from "./utils/number";
export type { NumericInput } from "./utils/number";

export type {
  StackBuildResult,
  StackSeriesRow,
  StackTotal,
  StackOptions,
} from "./utils/stack";
export { buildStackSeries, summarizeStackTotals } from "./utils/stack";
export {
  getPeriodGroupingOptions,
  groupPeriod,
  formatPeriodLabel,
  getPeriodFormatter,
  sortGroupedPeriods,
  groupingToApproxMonths,
  parseYearMonth,
} from "./utils/period";
export type {
  PeriodGrouping,
  PeriodGroupingOption,
  PeriodFormatter,
  PeriodFormatterOptions,
} from "./utils/period";
export {
  normalizeTimeRange,
  monthsFromRange,
  DEFAULT_TIME_RANGE_OPTIONS,
  DEFAULT_TIME_RANGE,
  limitTimeRangeOptions,
} from "./utils/time-range";
export type { TimeRangeOption } from "./utils/time-range";
export { aggregateSeriesByPeriod } from "./utils/series";
export type {
  SeriesAggregationField,
  SeriesAggregationMode,
} from "./utils/series";
export type { TimelineEvent, TimelineEventCategory } from "./types/timeline";
export {
  mergeSearchParams,
  buildSearchString,
  getSearchParamString,
  getSearchParamNumber,
} from "./utils/search-params";
export type {
  SearchParamEntry,
  SearchParamUpdates,
  SearchParamsLike,
  SearchParamsReadable,
  MergeSearchParamsOptions,
  GetSearchParamNumberOptions,
  GetSearchParamStringOptions,
} from "./utils/search-params";
export { buildKeyLabelMap } from "./utils/labels";
export type { KeyLabelOption } from "./utils/labels";
export type {
  StackChartSpec,
  StackChartMetric,
  StackChartDefaults,
  StackChartControlsConfig,
  StackChartBuildOptions,
} from "./charting/stacked-chart-spec";
export {
  getStackChartMetric,
  buildStackChartSeries,
  summarizeStackChartTotals,
} from "./charting/stacked-chart-spec";
export { useStackChartState } from "./hooks/use-stack-chart";
export type {
  UseStackChartStateOptions,
  UseStackChartStateResult,
} from "./hooks/use-stack-chart";
