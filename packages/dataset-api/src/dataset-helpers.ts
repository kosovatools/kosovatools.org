import {
  aggregateSeriesByPeriod,
  buildStackSeries,
  summarizeStackTotals,
  groupPeriod,
  getPeriodFormatter,
  formatDate,
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
  DatasetMetaField,
  DimensionHierarchyNode,
  DimensionOption,
  GenericDatasetMeta,
  TimeGranularity,
} from "@kosovatools/data-types";

// ---------- Meta helpers ----------
type KeyLabelOption<TKey extends string = string> = Readonly<{
  key: TKey;
  label?: string | null;
}>;

export type LabelMap<TKey extends string = string> = ReadonlyMap<TKey, string>;

export function formatGeneratedAt(
  generatedAt?: string | null,
  locale = "sq-AL",
  fallback = "E panjohur",
): string {
  return formatDate(
    generatedAt ?? null,
    {
      locale,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    { fallback, preserveInputOnInvalid: false },
  );
}

export function latestUpdatedAt(
  metas: Array<GenericDatasetMeta | undefined>,
): string | null {
  let latest: string | null = null;
  for (const meta of metas) {
    const updatedAt = meta?.updated_at;
    if (!updatedAt) continue;
    if (!latest || updatedAt > latest) latest = updatedAt;
  }
  return latest;
}

function getSafeLabel<TKey extends string>(
  option: KeyLabelOption<TKey>,
): string {
  const { key, label } = option;
  if (typeof label === "string" && label.trim().length > 0) return label;
  return key;
}

export function createLabelMap<TKey extends string>(
  options?: ReadonlyArray<KeyLabelOption<TKey> | null | undefined>,
): Readonly<Record<TKey, string>> {
  if (!options?.length) return {} as Readonly<Record<TKey, string>>;
  const filtered = options.filter((option): option is KeyLabelOption<TKey> =>
    Boolean(option?.key && typeof option.key === "string"),
  );
  const entries = filtered.map((option) => [option.key, getSafeLabel(option)]);
  return Object.fromEntries(entries) as Readonly<Record<TKey, string>>;
}

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

// ---------- Dataset helpers ----------
export type DatasetViewOptions = {
  limit?: number | null;
  slice?: { start?: string; end?: string };
};

type DatasetRecordBase = { period: string };

export type GenericDataset = Dataset<DatasetRecordBase, GenericDatasetMeta>;

type DatasetViewRecord<TDataset extends GenericDataset> =
  TDataset extends Dataset<
    infer TRecord extends DatasetRecordBase,
    infer _TMeta
  >
    ? TRecord
    : DatasetRecordBase;

type DatasetViewMeta<TDataset extends GenericDataset> =
  TDataset extends Dataset<
    infer _TRecord extends DatasetRecordBase,
    infer TMeta extends GenericDatasetMeta
  >
    ? TMeta
    : GenericDatasetMeta;

export type DatasetView<TDataset extends GenericDataset> = Dataset<
  DatasetViewRecord<TDataset>,
  DatasetViewMeta<TDataset>
> & {
  limit: (periods?: number | null) => DatasetView<TDataset>;
  slice: (range: { start?: string; end?: string }) => DatasetView<TDataset>;
  periods: (options?: { grouping?: PeriodGrouping }) => ReadonlyArray<string>;
  viewAsStack<TKey extends string>(
    config: DatasetStackConfig<DatasetViewRecord<TDataset>, TKey>,
  ): DatasetStackResult<TKey>;
  summarizeStack<TKey extends string>(
    config: DatasetStackConfig<DatasetViewRecord<TDataset>, TKey>,
  ): StackTotal<TKey>[];
  aggregate<TKey extends string>(
    options: DatasetAggregateOptions<DatasetViewRecord<TDataset>, TKey>,
  ): DatasetAggregateRow<TKey>[];
};

export type GenericDatasetView<
  TDataset extends GenericDataset = GenericDataset,
> = DatasetView<TDataset>;

export type HydratableDataset<
  TDataset extends GenericDataset = GenericDataset,
> =
  TDataset extends DatasetView<infer InnerDataset extends GenericDataset>
    ? InnerDataset
    : TDataset;

export type SerializableDataset<
  TDataset extends GenericDataset = GenericDataset,
> = Pick<HydratableDataset<TDataset>, "meta" | "records">;

export type DatasetAggregateField<
  TRecord extends DatasetRecordBase,
  TKey extends string,
> = {
  key: TKey;
  valueAccessor?: (record: TRecord) => number | null | undefined;
  mode?: SeriesAggregationField<TRecord, TKey>["mode"];
};

export type DatasetAggregateFieldInput<
  TRecord extends DatasetRecordBase,
  TKey extends string,
> = DatasetAggregateField<TRecord, TKey> | TKey;

export type DatasetAggregateOptions<
  TRecord extends DatasetRecordBase,
  TKey extends string,
> = {
  fields: ReadonlyArray<DatasetAggregateFieldInput<TRecord, TKey>>;
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
  keyAccessor?: (record: TRecord) => TKey;
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
): DatasetView<Dataset<TRecord, TMeta>> {
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
>(
  meta: TMeta,
  records: ReadonlyArray<TRecord>,
): DatasetView<Dataset<TRecord, TMeta>> {
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

type NormalizedDatasetAggregateField<
  TRecord extends DatasetRecordBase,
  TKey extends string,
> = {
  key: TKey;
  valueAccessor: (record: TRecord) => number | null | undefined;
  mode?: SeriesAggregationField<TRecord, TKey>["mode"];
};

function createDefaultValueAccessor<
  TRecord extends DatasetRecordBase,
  TKey extends string,
>(key: TKey): (record: TRecord) => number | null | undefined {
  return (record: TRecord) => {
    const value = (record as Record<string, unknown>)[key];
    return typeof value === "number" ? value : null;
  };
}

function createAggregateField<
  TRecord extends DatasetRecordBase,
  TKey extends string,
>(
  key: TKey,
  field?: DatasetAggregateField<TRecord, TKey>,
): NormalizedDatasetAggregateField<TRecord, TKey> {
  return {
    key,
    valueAccessor:
      field?.valueAccessor ?? createDefaultValueAccessor<TRecord, TKey>(key),
    mode: field?.mode,
  };
}

function normalizeAggregateFields<
  TRecord extends DatasetRecordBase,
  TKey extends string,
>(
  fields: ReadonlyArray<DatasetAggregateFieldInput<TRecord, TKey>>,
): NormalizedDatasetAggregateField<TRecord, TKey>[] {
  return fields.map((field) =>
    typeof field === "string"
      ? createAggregateField<TRecord, TKey>(field)
      : createAggregateField<TRecord, TKey>(field.key, field),
  );
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
  const fields = normalizeAggregateFields(options.fields);
  const relevantRecords = options.filter
    ? records.filter(options.filter)
    : records;
  const metaFieldLookup = buildMetaFieldLookup(meta.fields);

  if (!relevantRecords.length || !fields.length) {
    return [];
  }

  const datasetGranularity = meta.time.granularity;
  const grouping = options.grouping ?? datasetGranularity;

  if (grouping === datasetGranularity) {
    return relevantRecords.map((record) => {
      const values: Record<TKey, number | null> = {} as Record<
        TKey,
        number | null
      >;

      for (const field of fields) {
        values[field.key] = field.valueAccessor(record) ?? null;
      }

      return {
        period: record.period,
        ...values,
      } as DatasetAggregateRow<TKey>;
    });
  }

  const seriesFields: SeriesAggregationField<TRecord, TKey>[] = fields.map(
    (field) => ({
      key: field.key,
      getValue: (record) => field.valueAccessor(record) ?? null,
      mode: field.mode ?? inferFieldAggregationMode(metaFieldLookup, field.key),
    }),
  );

  return aggregateSeriesByPeriod(relevantRecords, {
    getPeriod: (record) => record.period,
    grouping,
    fields: seriesFields,
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

  const resolvedKeyAccessor =
    keyAccessor ??
    (dimension
      ? (record: TRecord) =>
          (record as Record<string, unknown>)[dimension] as TKey
      : undefined);

  if (!resolvedKeyAccessor) {
    throw new Error(
      "Dataset stack config requires a keyAccessor or dimension to derive keys.",
    );
  }

  const accessors = {
    period: (record: TRecord) => record.period,
    key: (record: TRecord) => resolvedKeyAccessor(record),
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

// ---------- Dimension hierarchy UI helper ----------
export type DimensionHierarchyUiNode = {
  id: string;
  label: string;
  children?: DimensionHierarchyUiNode[];
};

export type UiHierarchyResult = {
  nodes: DimensionHierarchyUiNode[];
  labelMap: Record<string, string>;
  defaultId: string | null;
};

export function buildUiHierarchy(
  hierarchy: ReadonlyArray<DimensionHierarchyNode> | undefined,
  options: ReadonlyArray<DimensionOption<string>> | undefined,
): UiHierarchyResult {
  if (!hierarchy?.length) {
    const fallbackOptions = options?.filter(Boolean) ?? [];
    const fallbackNodes = fallbackOptions.map<DimensionHierarchyUiNode>(
      (option) => ({
        id: option.key,
        label: option.label,
        children: [],
      }),
    );
    const fallbackLabelMap = Object.fromEntries(
      fallbackOptions.map((option) => [option.key, option.label]),
    );
    return {
      nodes: fallbackNodes,
      labelMap: fallbackLabelMap,
      defaultId: fallbackOptions[0]?.key ?? null,
    };
  }

  const nodeMap = new Map<string, DimensionHierarchyNode>();
  hierarchy.forEach((node) => nodeMap.set(node.key, node));

  const uiNodeCache = new Map<string, DimensionHierarchyUiNode>();

  const toUiNode = (key: string): DimensionHierarchyUiNode | null => {
    if (uiNodeCache.has(key)) return uiNodeCache.get(key)!;
    const node = nodeMap.get(key);
    if (!node) return null;
    const uiChildren = node.children
      .map((childKey) => toUiNode(childKey))
      .filter((child): child is DimensionHierarchyUiNode => Boolean(child));
    const uiNode: DimensionHierarchyUiNode = {
      id: node.key,
      label: node.label,
      children: uiChildren,
    };
    uiNodeCache.set(key, uiNode);
    return uiNode;
  };

  const rootKeys = hierarchy
    .filter((node) => !node.parent)
    .map((node) => node.key);
  const nodes = rootKeys
    .map((key) => toUiNode(key))
    .filter((node): node is DimensionHierarchyUiNode => Boolean(node));

  const labelMap: Record<string, string> = {};
  hierarchy.forEach((node) => {
    labelMap[node.key] = node.label;
  });

  return {
    nodes,
    labelMap,
    defaultId: rootKeys[0] ?? hierarchy[0]?.key ?? null,
  };
}
