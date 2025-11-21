import {
  aggregateSeriesByPeriod,
  buildStackSeries,
  summarizeStackTotals,
  groupPeriod,
  getPeriodFormatter,
  type PeriodGrouping,
  type PeriodFormatterOptions,
  type SeriesAggregationField,
  type StackBuildResult,
  type StackOptions,
  type StackTotal,
} from "@workspace/utils";
import type {
  Dataset,
  DatasetMeta,
  DimensionOption,
  DatasetMetaField,
} from "../types/dataset";
import { createLabelMap } from "./meta";
import { TimeGranularity } from "@workspace/utils/utils/time-range";

type GenericDatasetMeta = DatasetMeta<string, string, TimeGranularity, object>;

export type DatasetCoverageLabelOptions = Readonly<{
  formatPeriod?: (period: string) => string;
  formatterOptions?: PeriodFormatterOptions;
  separator?: string;
}>;

export function getDatasetCoverageLabel(
  meta: GenericDatasetMeta,
  options: DatasetCoverageLabelOptions = {},
): string {
  const first = meta.time.first;
  const last = meta.time.last;

  const formatPeriod =
    options.formatPeriod ??
    getPeriodFormatter(meta.time.granularity, options.formatterOptions);

  const formattedFirst = formatPeriod(first);
  const formattedLast = formatPeriod(last);

  if (!formattedFirst && !formattedLast) return "";
  if (!formattedFirst) return formattedLast;
  if (!formattedLast) return formattedFirst;

  const separator = options.separator ?? " – ";
  return `${formattedFirst}${separator}${formattedLast}`;
}

export type DatasetViewOptions = {
  limit?: number | null;
  slice?: { start?: string; end?: string };
};

type DatasetRecordBase = { period: string };

export type DatasetView<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
> = Dataset<TRecord, TMeta> & {
  limit: (periods?: number | null) => DatasetView<TRecord, TMeta>;
  slice: (range: {
    start?: string;
    end?: string;
  }) => DatasetView<TRecord, TMeta>;
  periods: (options?: { grouping?: PeriodGrouping }) => ReadonlyArray<string>;
  viewAsStack<TKey extends string>(
    config: DatasetStackConfig<TRecord, TKey>,
  ): DatasetStackResult<TKey>;
  summarizeStack<TKey extends string>(
    config: DatasetStackConfig<TRecord, TKey>,
  ): StackTotal<TKey>[];
  aggregate<TKey extends string>(
    options: DatasetAggregateOptions<TRecord, TKey>,
  ): DatasetAggregateRow<TKey>[];
};

export type GenericDataset = Dataset<
  DatasetRecordBase,
  DatasetMeta<string, string, TimeGranularity, object>
>;

export type ToDatasetView<T> =
  T extends Dataset<
    infer TRecord extends DatasetRecordBase,
    infer TMeta extends DatasetMeta<string, string, TimeGranularity, object>
  >
    ? DatasetView<TRecord, TMeta>
    : never;

export type DatasetAggregateField<
  TRecord extends DatasetRecordBase,
  TKey extends string,
> = {
  key: TKey;
  valueAccessor: (record: TRecord) => number | null | undefined;
  mode?: SeriesAggregationField<TRecord, TKey>["mode"];
};

export type DatasetAggregateOptions<
  TRecord extends DatasetRecordBase,
  TKey extends string,
> = {
  fields: ReadonlyArray<DatasetAggregateField<TRecord, TKey>>;
  grouping?: PeriodGrouping;
  filter?: (record: TRecord) => boolean;
};

export type DatasetAggregateRow<TKey extends string> = {
  period: string;
} & Record<TKey, number | null>;

export type DatasetStackConfig<
  TRecord extends DatasetRecordBase,
  TKey extends string,
> = {
  keyAccessor: (record: TRecord) => TKey;
  valueAccessor: (record: TRecord) => number | null | undefined;
  dimension?: string;
  dimensionOptions?: ReadonlyArray<DimensionOption<string>>;
  labelForKey?: (key: TKey) => string;
} & Omit<StackOptions<TKey>, "labelForKey" | "baseGrouping">;

export type DatasetStackResult<TKey extends string> = Pick<
  StackBuildResult<TKey>,
  "keys" | "series" | "labelMap"
>;

export function createDataset<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
>(
  data: Dataset<TRecord, TMeta>,
  options: DatasetViewOptions = {},
): DatasetView<TRecord, TMeta> {
  ensureSlugSafeDimensionKeys(data.meta, data.records);
  const initialRecords = applyViewOptions(data.records, options);
  return buildDatasetView(data.meta, initialRecords);
}

export function limitDataset<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
>(dataset: Dataset<TRecord, TMeta>, periods?: number | null) {
  return createDataset(dataset, { limit: periods ?? null });
}

function buildDatasetView<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
>(meta: TMeta, records: ReadonlyArray<TRecord>): DatasetView<TRecord, TMeta> {
  const getRecords = () => [...records];

  return {
    meta,
    records,
    limit: (periods) =>
      buildDatasetView(meta, limitRecords(getRecords(), periods ?? null)),
    slice: (range) => buildDatasetView(meta, sliceRecords(getRecords(), range)),
    periods: (options) => listPeriods(getRecords(), options?.grouping ?? null),
    viewAsStack: (config) => buildStackView(meta, getRecords(), config),
    summarizeStack: (config) => summarizeStackView(meta, getRecords(), config),
    aggregate: (options) => aggregateRecords(meta, getRecords(), options),
  };
}

function applyViewOptions<TRecord extends DatasetRecordBase>(
  records: ReadonlyArray<TRecord>,
  options: DatasetViewOptions,
): ReadonlyArray<TRecord> {
  let next = records;
  if (options.limit != null) next = limitRecords(next, options.limit);
  if (options.slice) next = sliceRecords(next, options.slice);
  return next;
}

const SLUG_SAFE_KEY = /^[A-Za-z0-9._-]+$/;

function ensureSlugSafeDimensionKeys<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
>(meta: TMeta, records: ReadonlyArray<TRecord>): void {
  const dimensions = meta.dimensions ?? {};
  const datasetId = meta.id ?? "dataset";
  const assertSlugSafe = (value: string, context: string) => {
    if (!SLUG_SAFE_KEY.test(value)) {
      throw new Error(
        `Dataset "${datasetId}" ${context} "${value}". Use slugifyLabel to normalize values during fetch.`,
      );
    }
  };

  for (const [dimension, options] of Object.entries(dimensions)) {
    for (const option of options ?? []) {
      const key = option?.key;
      if (key === undefined || key === null) continue;
      assertSlugSafe(
        String(key),
        `has an unsafe key in dimension "${dimension}":`,
      );
    }
  }

  for (const record of records) {
    for (const dimension of Object.keys(dimensions)) {
      const value = (record as Record<string, unknown>)[dimension];
      if (typeof value === "string")
        assertSlugSafe(value, `contains an unsafe "${dimension}" value`);
    }
  }
}

function limitRecords<TRecord extends DatasetRecordBase>(
  records: ReadonlyArray<TRecord>,
  periods: number | null,
): ReadonlyArray<TRecord> {
  if (periods == null || periods <= 0) return [...records];

  const uniquePeriods = Array.from(
    new Set(records.map((record) => record.period)),
  ).sort((a, b) => a.localeCompare(b));

  const keep = new Set(uniquePeriods.slice(-periods));
  return records.filter((record) => keep.has(record.period));
}

function sliceRecords<TRecord extends DatasetRecordBase>(
  records: ReadonlyArray<TRecord>,
  range: { start?: string; end?: string },
): ReadonlyArray<TRecord> {
  const start = range.start ?? null;
  const end = range.end ?? null;

  return records.filter((record) => {
    if (start && record.period < start) return false;
    if (end && record.period > end) return false;
    return true;
  });
}

function listPeriods<TRecord extends DatasetRecordBase>(
  records: ReadonlyArray<TRecord>,
  grouping: PeriodGrouping | null,
): ReadonlyArray<string> {
  const set = new Set<string>();

  for (const record of records) {
    const period =
      grouping && grouping !== "monthly"
        ? groupPeriod(record.period, grouping)
        : record.period;
    set.add(period);
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function buildStackView<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
  TKey extends string,
>(
  meta: TMeta,
  records: ReadonlyArray<TRecord>,
  config: DatasetStackConfig<TRecord, TKey>,
): DatasetStackResult<TKey> {
  const { accessors, options } = prepareStackContext(meta, config);

  const result = buildStackSeries(records, accessors, options);
  return {
    keys: result.keys,
    series: result.series,
    labelMap: result.labelMap,
  };
}

function summarizeStackView<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
  TKey extends string,
>(
  meta: TMeta,
  records: ReadonlyArray<TRecord>,
  config: DatasetStackConfig<TRecord, TKey>,
): StackTotal<TKey>[] {
  const { accessors, options } = prepareStackContext(meta, config);
  return summarizeStackTotals(records, accessors, options);
}

function buildDimensionContext<
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
  TKey extends string,
>(
  meta: TMeta,
  dimension?: string,
  dimensionOptions?: ReadonlyArray<DimensionOption<string>>,
): {
  labelMap: Readonly<Record<TKey, string>>;
  allowedKeys?: readonly TKey[];
} {
  const dimensionOpts =
    dimensionOptions ??
    (dimension
      ? (meta.dimensions?.[dimension] as
          | ReadonlyArray<DimensionOption<TKey>>
          | undefined)
      : undefined);

  const labelMap = dimensionOpts
    ? createLabelMap(dimensionOpts as ReadonlyArray<DimensionOption<TKey>>)
    : ({} as Readonly<Record<TKey, string>>);

  const allowedKeys = dimensionOpts
    ? (dimensionOpts.map((opt) => opt.key as TKey) as readonly TKey[])
    : undefined;

  return { labelMap, allowedKeys };
}

function aggregateRecords<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
  TKey extends string,
>(
  meta: TMeta,
  records: ReadonlyArray<TRecord>,
  options: DatasetAggregateOptions<TRecord, TKey>,
): DatasetAggregateRow<TKey>[] {
  const relevantRecords = options.filter
    ? records.filter(options.filter)
    : records;
  const metaFieldLookup = buildMetaFieldLookup(meta.fields);

  if (!relevantRecords.length || !options.fields.length) {
    return [];
  }

  const datasetGranularity = meta.time.granularity;
  const grouping = options.grouping ?? datasetGranularity;

  if (grouping === datasetGranularity) {
    return relevantRecords.map((record) => {
      // Build just the metric values first
      const values: Record<TKey, number | null> = {} as Record<
        TKey,
        number | null
      >;

      for (const field of options.fields) {
        values[field.key] = field.valueAccessor(record) ?? null;
      }

      // Then combine with period and assert the final shape
      return {
        period: record.period,
        ...values,
      } as DatasetAggregateRow<TKey>;
    });
  }

  const fields: SeriesAggregationField<TRecord, TKey>[] = options.fields.map(
    (field) => ({
      key: field.key,
      getValue: (record) => field.valueAccessor(record) ?? null,
      mode: field.mode ?? inferFieldAggregationMode(metaFieldLookup, field.key),
    }),
  );

  return aggregateSeriesByPeriod(relevantRecords, {
    getPeriod: (record) => record.period,
    grouping,
    fields,
  });
}

function prepareStackContext<
  TRecord extends DatasetRecordBase,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
  TKey extends string,
>(
  meta: TMeta,
  config: DatasetStackConfig<TRecord, TKey>,
): {
  options: StackOptions<TKey>;
  accessors: {
    period: (record: TRecord) => string;
    key: (record: TRecord) => TKey;
    value: (record: TRecord) => number;
  };
  labelMap: Readonly<Record<TKey, string>>;
} {
  const {
    keyAccessor,
    valueAccessor,
    dimension,
    dimensionOptions,
    labelForKey,
    ...rest
  } = config;

  const { labelMap, allowedKeys } = buildDimensionContext(
    meta,
    dimension,
    dimensionOptions,
  );

  const baseOptions = rest as StackOptions<TKey>;
  const mergedAllowedKeys = (baseOptions.allowedKeys ?? allowedKeys) as
    | readonly TKey[]
    | undefined;

  const options: StackOptions<TKey> = {
    ...baseOptions,
    baseGrouping: meta.time.granularity,
    allowedKeys: mergedAllowedKeys,
    labelForKey: labelForKey ?? ((key: TKey) => labelMap[key] ?? key),
  };

  const accessors = {
    period: (record: TRecord) => record.period,
    key: (record: TRecord) => keyAccessor(record),
    value: (record: TRecord) => valueAccessor(record) ?? 0,
  };

  return { options, accessors, labelMap };
}

function buildMetaFieldLookup(
  fields: ReadonlyArray<DatasetMetaField<string>>,
): Map<string, DatasetMetaField<string>> {
  return new Map(fields.map((field) => [field.key, field]));
}

function inferFieldAggregationMode(
  fields: Map<string, DatasetMetaField<string>>,
  key: string,
) {
  const metaField = fields.get(key);
  switch (metaField?.value_type) {
    case "stock":
      return "average";
    case "rate":
      return "rate";
    default:
      return undefined;
  }
}
