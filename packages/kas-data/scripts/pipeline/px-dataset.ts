import {
  PxError,
  pxGetMeta,
  pxPostData,
  tableLookup,
  lookupTableValue,
  metaVariables,
  buildValuePairs,
  readCubeMetadata,
  type PxCube,
  type PxMeta,
  type PxVariable,
} from "../lib/pxweb";
import {
  createMeta,
  describePxSources,
  tidyNumber,
  type Meta,
  type MetaField,
  type DimensionOption,
  type TimeGranularity,
} from "../lib/utils";
import { writeJson } from "../lib/io";

export class PxPipelineSkip extends PxError {
  constructor(message: string) {
    super(message);
    this.name = "PxPipelineSkip";
  }
}

type DimensionCodeResolver =
  | string
  | ((context: DimensionResolverContext) => string | null | undefined);

type DimensionValueSpec = {
  code: string;
  label?: string | null;
  key?: string;
  unit?: string | null;
  [k: string]: unknown;
};

type ResolvedDimensionValue = DimensionValueSpec & {
  code: string;
  label: string;
  metaLabel: string;
};

type AxisDimensionSpec = {
  code: DimensionCodeResolver;
  text?: string | null;
  alias?: string;
  values?: DimensionValueSpec[];
  resolveValues?: (
    context: DimensionValueResolverContext,
  ) => DimensionValueSpec[];
  toLabel?: (valueCode: string, context: DimensionValueLabelContext) => string;
  iterate?: boolean;
  sort?: (a: ResolvedDimensionValue, b: ResolvedDimensionValue) => number;
  granularity?: TimeGranularity;
};

type TimeDimensionSpec = AxisDimensionSpec & { alias?: string };

type MetricDimensionSpec = {
  code: DimensionCodeResolver; // may be implicit (return null) -> single metric
  text?: string | null;
  alias?: string; // ignored in meta.dimensions (metrics are not a dimension)
  values?: DimensionValueSpec[];
  resolveValues?: (
    context: DimensionValueResolverContext,
  ) => DimensionValueSpec[];
  toLabel?: (valueCode: string, context: DimensionValueLabelContext) => string;
  sort?: (a: ResolvedDimensionValue, b: ResolvedDimensionValue) => number;
};

type QueryDimensionSpec = { code: string; values: string[] };

type DimensionResolverContext = {
  datasetId: string;
  meta: PxMeta;
  variables: PxVariable[];
  resolved: { timeCode?: string; axisCodes: string[]; metricCodes: string[] };
};

type DimensionValueResolverContext = DimensionResolverContext & {
  variable: PxVariable | null;
  baseValues: ResolvedDimensionValue[];
};

type DimensionValueLabelContext = {
  datasetId: string;
  value: ResolvedDimensionValue;
  variable: PxVariable | null;
  meta: PxMeta;
};

type AxisContextEntry = {
  code: string;
  label: string;
  metaLabel: string;
  value: ResolvedDimensionValue;
  dimension: ResolvedAxisDimension;
};

type ResolvedAxisDimension = {
  code: string;
  alias: string;
  variable: PxVariable | null;
  values: ResolvedDimensionValue[];
  iterate: boolean;
  isTime: boolean;
  spec: AxisDimensionSpec;
};

type ResolvedMetricDimension = {
  code: string;
  variable: PxVariable | null;
  values: ResolvedDimensionValue[];
  hasDimension: boolean;
  spec: MetricDimensionSpec;
};

type FinalizeDatasetContext<RecordShape extends Record<string, unknown>> = {
  datasetId: string;
  meta: Meta;
  sourceMeta: PxMeta;
  cube: PxCube;
  cubeSummary: ReturnType<typeof readCubeMetadata>;
  axes: ResolvedAxisDimension[];
  metrics: ResolvedMetricDimension[];
  records: RecordShape[];
  fields: MetaField[];
  dimensions: Record<string, DimensionOption[]>;
  granularity: TimeGranularity;
};

type RecordContext = {
  datasetId: string;
  periodCode: string;
  period: string;
  axes: Record<string, AxisContextEntry>;
  axisByCode: Record<string, AxisContextEntry>;
  values: Record<string, number | null>;
  assignments: Record<string, string>;
  getValue: (key: string) => number | null;
};

type DefaultDatasetShape<RecordShape extends Record<string, unknown>> = {
  meta: Meta;
  records: RecordShape[];
};

export type PipelineSpec<
  RecordShape extends Record<string, unknown>,
  DatasetShape = DefaultDatasetShape<RecordShape>,
> = {
  datasetId: string;
  filename: string;
  parts: readonly string[];
  outDir: string;
  generatedAt: string;
  meta?: PxMeta;
  timeDimension: TimeDimensionSpec;
  axes?: AxisDimensionSpec[];
  metricDimensions?: MetricDimensionSpec[];
  queryDimensions?: QueryDimensionSpec[];
  unit?: string | null; // optional default
  extraFields?: MetaField[]; // will be appended; must have units
  createRecord: (
    context: RecordContext,
  ) => RecordShape | RecordShape[] | null | undefined;
  buildNotes?: (context: {
    cubeSummary: ReturnType<typeof readCubeMetadata>;
  }) => string[] | undefined;
  finalizeDataset?: (
    context: FinalizeDatasetContext<RecordShape>,
  ) => DatasetShape;
  writeFile?: boolean;
};

export async function runPxDatasetPipeline<
  RecordShape extends Record<string, unknown>,
  DatasetShape = DefaultDatasetShape<RecordShape>,
>(spec: PipelineSpec<RecordShape, DatasetShape>): Promise<DatasetShape> {
  const {
    datasetId,
    filename,
    parts,
    outDir,
    generatedAt,
    timeDimension,
    axes = [],
    metricDimensions: metricSpecs = [],
    queryDimensions = [],
    unit = null,
    createRecord,
    extraFields = [],
    buildNotes,
    finalizeDataset,
    meta: providedMeta,
    writeFile = true,
  } = spec;

  if (!datasetId) throw new PxError("runPxDatasetPipeline: missing datasetId");
  if (!filename) throw new PxError(`${datasetId}: expected output filename`);
  if (!Array.isArray(parts) || !parts.length)
    throw new PxError(`${datasetId}: expected PX path parts for dataset`);

  const defaultSourcePaths = [parts] as const;
  const { description: defaultSource, urls: defaultSourceUrls } =
    describePxSources(defaultSourcePaths);

  const meta = providedMeta ?? (await pxGetMeta(parts));
  const variables = metaVariables(meta);
  const resolverContext: DimensionResolverContext = {
    datasetId,
    meta,
    variables,
    resolved: { timeCode: undefined, axisCodes: [], metricCodes: [] },
  };

  const resolvedTime = resolveAxisDimension(timeDimension, resolverContext, {
    isTime: true,
    axisIndex: 0,
  });
  resolverContext.resolved.timeCode = resolvedTime.code;

  const resolvedAxes: ResolvedAxisDimension[] = [];
  axes.forEach((axisSpec, axisIndex) => {
    const resolved = resolveAxisDimension(axisSpec, resolverContext, {
      isTime: false,
      axisIndex: axisIndex + 1,
    });
    resolvedAxes.push(resolved);
  });

  if (!Array.isArray(metricSpecs) || metricSpecs.length === 0)
    throw new PxError(`${datasetId}: expected at least one metric dimension`);
  const resolvedMetrics: ResolvedMetricDimension[] = metricSpecs.map(
    (metricSpec, metricIndex) =>
      resolveMetricDimension(metricSpec, resolverContext, metricIndex),
  );

  const allAxes = [resolvedTime, ...resolvedAxes];

  const dimensionOptions: Record<string, DimensionOption[]> = {};
  const captureDimensionOptions = (
    alias: string | null | undefined,
    values: ResolvedDimensionValue[],
  ) => {
    if (!alias || !values.length) return;
    if (alias === resolvedTime.alias) return; // never include period in dimensions
    dimensionOptions[alias] = values.map((v) => {
      const label = v.metaLabel || v.label || v.code;
      const optionKey =
        typeof v.key === "string" && v.key.length ? v.key : v.code;
      return {
        key: optionKey,
        label,
      };
    });
  };

  resolvedAxes.forEach((axis) =>
    captureDimensionOptions(axis.alias, axis.values),
  );

  const resolvedGranularity: TimeGranularity =
    timeDimension.granularity ??
    ((): TimeGranularity => {
      throw new PxError(`${datasetId}: time granularity is required`);
    })();

  const query = [
    ...allAxes.map((dimension) => ({
      code: dimension.code,
      selection: {
        filter: "item",
        values: dimension.values.map((v) => v.code),
      },
    })),
    ...resolvedMetrics
      .filter((dimension) => dimension.hasDimension)
      .map((dimension) => ({
        code: dimension.code,
        selection: {
          filter: "item",
          values: dimension.values.map((v) => v.code),
        },
      })),
    ...queryDimensions.map((dimension) => ({
      code: dimension.code,
      selection: {
        filter: "item",
        values: dimension.values.map((v) => String(v)),
      },
    })),
  ];

  const cube = await pxPostData(parts, { query });
  const dimensionOrder = query.map((d) => d.code);
  const table = tableLookup(cube, dimensionOrder);
  if (!table) throw new PxError(`${datasetId}: unexpected PX response format`);
  const { dimCodes, lookup } = table;

  const baseAssignments: Record<string, string> = {};
  const baseAliasContext: Record<string, AxisContextEntry> = {};
  const baseCodeContext: Record<string, AxisContextEntry> = {};

  for (const axis of allAxes) {
    if (axis.iterate === false) {
      const firstValue = axis.values[0];
      if (!firstValue)
        throw new PxPipelineSkip(
          `${datasetId}: axis "${axis.code}" resolved no values`,
        );
      const entry = createAxisContextEntry(axis, firstValue);
      baseAssignments[axis.code] = firstValue.code;
      baseAliasContext[axis.alias] = entry;
      baseCodeContext[axis.code] = entry;
    }
  }

  for (const filter of queryDimensions) {
    if (!Array.isArray(filter.values) || filter.values.length === 0)
      throw new PxError(
        `${datasetId}: query dimension "${filter.code}" missing values`,
      );
    baseAssignments[filter.code] = String(filter.values[0]);
  }

  const iterableAxes = allAxes.filter((axis) => axis.iterate !== false);
  if (!iterableAxes.length)
    throw new PxError(`${datasetId}: no iterable axes configured`);

  const records: RecordShape[] = [];
  const timeAlias = resolvedTime.alias;

  const walk = (
    index: number,
    assignments: Record<string, string>,
    aliasCtx: Record<string, AxisContextEntry>,
    codeCtx: Record<string, AxisContextEntry>,
  ) => {
    if (index >= iterableAxes.length) {
      const periodEntry = aliasCtx[timeAlias];
      if (!periodEntry)
        throw new PxError(
          `${datasetId}: time dimension missing in record context`,
        );
      const values: Record<string, number | null> = {};
      for (const metric of resolvedMetrics) {
        if (!metric.hasDimension) {
          if (metric.values.length !== 1)
            throw new PxError(
              `${datasetId}: implicit metric dimension requires a single value`,
            );
          const metricSpec = metric.values[0]!;
          const raw = lookupTableValue(dimCodes, lookup, assignments);
          values[metricSpec.key ?? metricSpec.code] = tidyNumber(raw);
          continue;
        }
        for (const metricSpec of metric.values) {
          const raw = lookupTableValue(dimCodes, lookup, {
            ...assignments,
            [metric.code]: metricSpec.code,
          });
          values[metricSpec.key ?? metricSpec.code] = tidyNumber(raw);
        }
      }
      const getValue = (key: string) =>
        Object.prototype.hasOwnProperty.call(values, key)
          ? (values[key] ?? null)
          : null;
      const recordResult = createRecord({
        datasetId,
        periodCode: periodEntry.code,
        period: periodEntry.label,
        axes: aliasCtx,
        axisByCode: codeCtx,
        values,
        assignments,
        getValue,
      });
      if (Array.isArray(recordResult)) {
        for (const entry of recordResult) {
          if (entry && typeof entry === "object") records.push(entry);
          else if (entry !== null && entry !== undefined)
            throw new PxError(
              `${datasetId}: createRecord returned invalid array entry`,
            );
        }
      } else if (recordResult && typeof recordResult === "object") {
        records.push(recordResult);
      } else if (recordResult !== null && recordResult !== undefined) {
        throw new PxError(`${datasetId}: createRecord returned invalid value`);
      }
      return;
    }
    const axis = iterableAxes[index]!;
    for (const value of axis.values) {
      const entry = createAxisContextEntry(axis, value);
      walk(
        index + 1,
        { ...assignments, [axis.code]: value.code },
        { ...aliasCtx, [axis.alias]: entry },
        { ...codeCtx, [axis.code]: entry },
      );
    }
  };

  walk(
    0,
    { ...baseAssignments },
    { ...baseAliasContext },
    { ...baseCodeContext },
  );

  const cubeSummary = readCubeMetadata(cube);
  const datasetUnit = unit
    ? String(unit)
    : cubeSummary.unit
      ? String(cubeSummary.unit)
      : undefined;
  const updatedAt =
    typeof cubeSummary.updatedAt === "string"
      ? cubeSummary.updatedAt
      : (cubeSummary.updatedAt ?? null);

  // Time stats from resolvedTime values
  const periodCodes = resolvedTime.values.map((v) => v.label);
  const first = periodCodes[0] ?? "";
  const last = periodCodes[periodCodes.length - 1] ?? "";
  if (!first || !last)
    throw new PxError(`${datasetId}: unable to resolve first/last period`);

  // Build fields (units required)
  const fields: MetaField[] = [];
  for (const metric of resolvedMetrics) {
    for (const value of metric.values) {
      const key =
        typeof value.key === "string" && value.key.length
          ? value.key
          : value.code;
      const label =
        typeof value.label === "string" && value.label.length
          ? value.label
          : key;
      const entryUnit = value.unit ?? datasetUnit ?? "";
      if (!entryUnit)
        throw new PxError(`${datasetId}: unit is required for metric ${key}`);
      const exists = fields.some((f) => f.key === key);
      if (!exists) fields.push({ key, label, unit: entryUnit });
    }
  }
  fields.push(...extraFields); // extraFields must already have non-empty units

  const metrics = fields.map((f) => f.key);

  const metaObj = createMeta(datasetId, generatedAt, {
    updated_at: updatedAt,
    time: {
      key: "period",
      granularity: resolvedGranularity,
      first,
      last,
      count: resolvedTime.values.length,
    },
    fields,
    metrics,
    dimensions: dimensionOptions,
    unit: datasetUnit,
    source: defaultSource,
    source_urls: defaultSourceUrls,
    notes: buildNotes ? (buildNotes({ cubeSummary }) ?? []) : [],
  } as unknown as Meta);

  const defaultDataset: DefaultDatasetShape<RecordShape> = {
    meta: metaObj,
    records,
  };

  const dataset = finalizeDataset
    ? finalizeDataset({
        datasetId,
        meta: metaObj,
        sourceMeta: meta,
        cube,
        cubeSummary,
        axes: [resolvedTime, ...resolvedAxes],
        metrics: resolvedMetrics,
        records,
        fields,
        dimensions: dimensionOptions,
        granularity: resolvedGranularity,
      })
    : (defaultDataset as DatasetShape);

  if (writeFile) await writeJson(outDir, filename, dataset);
  return dataset;
}

function resolveAxisDimension(
  spec: AxisDimensionSpec,
  context: DimensionResolverContext,
  options: { isTime: boolean; axisIndex: number },
): ResolvedAxisDimension {
  const { datasetId, meta, variables } = context;
  const rawCode = resolveDimensionCode(spec.code, context);
  if (!rawCode)
    throw new PxError(`${datasetId}: axis dimension missing code resolver`);
  const code = String(rawCode);
  const variable = expectVariable(variables, datasetId, code, spec.text);
  const baseValues = prepareBaseValues(variable, options.isTime);
  const baseLookup = new Map(baseValues.map((entry) => [entry.code, entry]));

  let valueSpecs: DimensionValueSpec[];
  if (typeof spec.resolveValues === "function")
    valueSpecs = spec.resolveValues({ ...context, variable, baseValues });
  else if (Array.isArray(spec.values) && spec.values.length)
    valueSpecs = spec.values;
  else
    valueSpecs = baseValues.map((entry) => ({
      code: entry.code,
      label: entry.label,
    }));

  const values = normalizeDimensionValues(
    datasetId,
    code,
    valueSpecs,
    baseLookup,
    spec,
    variable,
    meta,
  );
  if (!values.length)
    throw new PxPipelineSkip(
      `${datasetId}: axis "${code}" resolved zero values`,
    );

  const alias =
    spec.alias ??
    (options.isTime ? "period" : code || `axis_${options.axisIndex}`);
  context.resolved.axisCodes.push(code);

  return {
    code,
    alias,
    variable,
    values,
    iterate: spec.iterate !== false,
    isTime: options.isTime,
    spec,
  };
}

function resolveMetricDimension(
  spec: MetricDimensionSpec,
  context: DimensionResolverContext,
  metricIndex: number,
): ResolvedMetricDimension {
  const { datasetId, meta, variables } = context;
  const rawCode = resolveDimensionCode(spec.code, context);
  const hasDimension = Boolean(rawCode);
  const code = hasDimension ? String(rawCode) : "";
  const variable = hasDimension
    ? expectVariable(variables, datasetId, code, spec.text)
    : null;
  const baseValues = prepareBaseValues(variable, false);
  const baseLookup = new Map(baseValues.map((entry) => [entry.code, entry]));

  let valueSpecs: DimensionValueSpec[];
  if (typeof spec.resolveValues === "function")
    valueSpecs = spec.resolveValues({ ...context, variable, baseValues });
  else if (Array.isArray(spec.values) && spec.values.length)
    valueSpecs = spec.values;
  else if (hasDimension)
    valueSpecs = baseValues.map((entry) => ({
      code: entry.code,
      label: entry.label,
      key: entry.code,
    }));
  else valueSpecs = [];

  if (!valueSpecs.length)
    throw new PxError(
      `${datasetId}: metric dimension ${hasDimension ? `"${code}"` : "(implicit)"} resolved zero values`,
    );

  const values = normalizeDimensionValues(
    datasetId,
    hasDimension ? code : `__metric_${metricIndex}`,
    valueSpecs,
    baseLookup,
    spec,
    variable,
    meta,
  );
  for (const value of values)
    if (!value.key || typeof value.key !== "string")
      throw new PxError(
        `${datasetId}: metric value "${value.code}" missing key`,
      );

  if (hasDimension) context.resolved.metricCodes.push(code);
  return { code, variable, values, hasDimension, spec };
}

function resolveDimensionCode(
  code: DimensionCodeResolver,
  context: DimensionResolverContext,
): string | null {
  if (typeof code === "function") {
    const result = code(context);
    if (result === undefined || result === null) return null;
    return String(result);
  }
  if (code === undefined || code === null) return null;
  return String(code);
}

function expectVariable(
  variables: PxVariable[],
  datasetId: string,
  code: string,
  expectedText?: string | null,
): PxVariable {
  const target = variables.find((v) => String(v?.code) === code);
  if (!target)
    throw new PxError(
      `${datasetId}: expected dimension "${code}" not found in PxWeb metadata`,
    );
  if (
    expectedText &&
    String(target.text ?? "").trim() !== String(expectedText).trim()
  ) {
    throw new PxError(
      `${datasetId}: dimension "${code}" text mismatch (expected "${expectedText}" got "${target.text ?? ""}")`,
    );
  }
  return target;
}

function prepareBaseValues(
  variable: PxVariable | null,
  isTime: boolean,
): ResolvedDimensionValue[] {
  if (!variable) return [];
  const pairs = buildValuePairs(variable);
  const mapped = pairs.map(([code, label]) => ({
    code: String(code),
    label: String(label),
    metaLabel: String(label),
  }));
  if (isTime && variable.time === true) mapped.reverse();
  return mapped;
}

type DimensionLikeSpec = {
  toLabel?: (valueCode: string, context: DimensionValueLabelContext) => string;
  sort?: (a: ResolvedDimensionValue, b: ResolvedDimensionValue) => number;
};

function normalizeDimensionValues(
  datasetId: string,
  dimensionCode: string,
  valueSpecs: DimensionValueSpec[],
  baseLookup: Map<string, ResolvedDimensionValue>,
  spec: DimensionLikeSpec,
  variable: PxVariable | null,
  meta: PxMeta,
): ResolvedDimensionValue[] {
  const resolved: ResolvedDimensionValue[] = valueSpecs.map((value) => {
    const code = String(value?.code ?? "");
    if (!code)
      throw new PxError(
        `${datasetId}: dimension "${dimensionCode}" has value without code`,
      );
    const base = baseLookup.get(code);
    if (!base && variable)
      throw new PxError(
        `${datasetId}: dimension "${dimensionCode}" missing expected code "${code}"`,
      );
    const metaLabel =
      base?.metaLabel ??
      base?.label ??
      (value.label ? String(value.label) : code);
    const interimLabel =
      value.label !== undefined && value.label !== null
        ? String(value.label)
        : (base?.label ?? metaLabel);
    const label =
      typeof spec.toLabel === "function"
        ? spec.toLabel(code, {
            datasetId,
            value: {
              ...(base ?? { code, label: interimLabel, metaLabel }),
              ...value,
              code,
              label: interimLabel,
              metaLabel,
            },
            variable,
            meta,
          })
        : interimLabel;
    return {
      ...(base ?? { code, label: interimLabel, metaLabel }),
      ...value,
      code,
      label,
      metaLabel,
    };
  });
  if (typeof spec.sort === "function") resolved.sort(spec.sort);
  return resolved;
}

function createAxisContextEntry(
  axis: ResolvedAxisDimension,
  value: ResolvedDimensionValue,
): AxisContextEntry {
  return {
    code: value.code,
    label: value.label,
    metaLabel: value.metaLabel,
    value,
    dimension: axis,
  };
}
