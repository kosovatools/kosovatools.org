import type { ValueFormatter } from "../formatters";
import type { NumericInput } from "../utils/number";
import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackOptions,
  type StackTotal,
} from "../utils/stack";
import type { TimeRangeOption, TimeRangeDefinition } from "../utils/time-range";
import type { PeriodGrouping, PeriodGroupingOption } from "../utils/period";

export type StackChartMetricFormatters = Readonly<{
  value: ValueFormatter;
  total?: ValueFormatter;
  axis?: ValueFormatter;
  summary?: ValueFormatter;
}>;

export type StackChartMetric<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> = Readonly<{
  key: string;
  label: string;
  description?: string;
  field?: string;
  unitLabel?: string | null;
  formatters: StackChartMetricFormatters;
  getValue?: (record: TRecord) => NumericInput;
}>;

export type StackChartDefaults = Readonly<{
  periodGrouping: PeriodGrouping;
  timeRange?: TimeRangeOption;
  top?: number;
  includeOther?: boolean;
}>;

export type StackChartControlsConfig = Readonly<{
  allowMetricSelection?: boolean;
  allowPeriodGrouping?: boolean;
  allowTimeRange?: boolean;
  allowTopSelection?: boolean;
  allowOtherToggle?: boolean;
}>;

export type StackChartAccessors<TRecord extends Record<string, unknown>> =
  Readonly<{
    getPeriod?: (record: TRecord) => string;
    getDimensionValue?: (record: TRecord) => string;
    getMetricValue?: (record: TRecord, metricKey: string) => NumericInput;
  }>;

export type StackChartSpec<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> = Readonly<{
  id: string;
  datasetId: string;
  title: string;
  description?: string;
  dimensionField: string;
  dimensionLabel?: string;
  dimensionLabels?: Readonly<Record<string, string>>;
  metrics: ReadonlyArray<StackChartMetric<TRecord>>;
  defaultMetricKey: string;
  defaults: StackChartDefaults;
  periodGroupingOptions?: ReadonlyArray<PeriodGroupingOption>;
  timeRangeOptions?: ReadonlyArray<TimeRangeDefinition>;
  controls?: StackChartControlsConfig;
  tags?: ReadonlyArray<string>;
  notes?: ReadonlyArray<string>;
  accessors?: StackChartAccessors<TRecord>;
}>;

export type StackChartBuildOptions = StackOptions<string> & {
  metricKey?: string;
};

type DefaultRecord = Record<string, unknown>;

function getDefaultPeriod(record: DefaultRecord): string {
  const value = record.period;
  return typeof value === "string" ? value : "";
}

function createDefaultDimensionAccessor(field: string) {
  return (record: DefaultRecord): string => {
    const value = record[field];
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return "";
  };
}

function createDefaultMetricAccessor(field: string) {
  return (record: DefaultRecord): NumericInput => record[field] as NumericInput;
}

export function getStackChartMetric<TRecord extends Record<string, unknown>>(
  spec: StackChartSpec<TRecord>,
  metricKey?: string,
): StackChartMetric<TRecord> {
  const targetKey = metricKey ?? spec.defaultMetricKey;
  const metric = spec.metrics.find((entry) => entry.key === targetKey);
  if (metric) {
    return metric;
  }
  throw new Error(
    `Stack chart spec "${spec.id}" does not define metric "${targetKey}".`,
  );
}

function buildAccessors<TRecord extends Record<string, unknown>>(
  spec: StackChartSpec<TRecord>,
  metric: StackChartMetric<TRecord>,
) {
  const periodAccessor =
    spec.accessors?.getPeriod ??
    ((record: TRecord) => getDefaultPeriod(record as DefaultRecord));

  const dimensionAccessor =
    spec.accessors?.getDimensionValue ??
    ((record: TRecord) =>
      createDefaultDimensionAccessor(spec.dimensionField)(
        record as DefaultRecord,
      ));

  const metricAccessor = spec.accessors?.getMetricValue
    ? (record: TRecord) => spec.accessors!.getMetricValue!(record, metric.key)
    : (metric.getValue ??
      ((record: TRecord) =>
        createDefaultMetricAccessor(metric.field ?? metric.key)(
          record as DefaultRecord,
        )));

  return {
    period: (record: TRecord) => periodAccessor(record),
    key: (record: TRecord) => dimensionAccessor(record),
    value: (record: TRecord) => metricAccessor(record),
  };
}

export function buildStackChartSeries<TRecord extends Record<string, unknown>>(
  spec: StackChartSpec<TRecord>,
  records: readonly TRecord[],
  options: StackChartBuildOptions = {},
): StackBuildResult<string> {
  const { metricKey, ...stackOptions } = options;
  const metric = getStackChartMetric(spec, metricKey);
  const accessors = buildAccessors(spec, metric);
  return buildStackSeries(records, accessors, stackOptions);
}

export function summarizeStackChartTotals<
  TRecord extends Record<string, unknown>,
>(
  spec: StackChartSpec<TRecord>,
  records: readonly TRecord[],
  options: StackChartBuildOptions = {},
): StackTotal<string>[] {
  const { metricKey, ...stackOptions } = options;
  const metric = getStackChartMetric(spec, metricKey);
  const accessors = buildAccessors(spec, metric);
  return summarizeStackTotals(records, accessors, stackOptions);
}
