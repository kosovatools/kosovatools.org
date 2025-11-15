import { PATHS } from "../lib/constants";
import {
  createMeta,
  describePxSources,
  normalizeYM,
  type MetaField,
} from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import { writeJson } from "../lib/io";
import { PxError } from "../lib/pxweb";

type PxDatasetResult<RecordShape extends Record<string, unknown>> = Awaited<
  ReturnType<typeof runPxDatasetPipeline<RecordShape>>
>;

type RawCpiRecord = { period: string; group: string; value: number | null };
type RawCpiDataset = PxDatasetResult<RawCpiRecord>;

export type CpiMetric = "index" | "change";

export type CpiRecord = {
  period: string;
  group: string;
} & Record<CpiMetric, number | null>;

const CPI_METRIC_FIELDS: ReadonlyArray<MetaField & { key: CpiMetric }> = [
  { key: "index", label: "CPI Index", unit: "" },
  { key: "change", label: "CPI Change (m/m)", unit: "%" },
];

const CPI_DATASET_ID = "kas_cpi_monthly";
const CPI_FILENAME = "kas_cpi_monthly.json";

const COMPONENT_SPECS = {
  index: {
    datasetId: "kas_cpi_index_monthly",
    path_key: "cpi_index",
    unit: "index",
  },
  change: {
    datasetId: "kas_cpi_change_monthly",
    path_key: "cpi_change",
    unit: "%",
  },
} as const satisfies Record<
  CpiMetric,
  { datasetId: string; path_key: keyof typeof PATHS; unit: string }
>;

type ComponentSpec = (typeof COMPONENT_SPECS)[CpiMetric];

async function fetchCpiComponent(
  outDir: string,
  generatedAt: string,
  spec: ComponentSpec,
): Promise<RawCpiDataset> {
  const parts = PATHS[spec.path_key];
  return runPxDatasetPipeline<RawCpiRecord>({
    datasetId: spec.datasetId,
    filename: `${spec.datasetId}.json`,
    parts,
    outDir,
    generatedAt,
    unit: spec.unit,
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    axes: [
      {
        code: "Grupet dhe nëngrupet",
        text: "Grupet dhe nëngrupet",
        alias: "group",
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [
          { code: "__value__", key: "value", label: "Value", unit: spec.unit },
        ],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const group = axes.group;
      if (!group) return null;
      const rawValue = values.value;
      const value =
        typeof rawValue === "number" ? rawValue : (rawValue ?? null);
      return { period, group: group.code, value };
    },
    writeFile: false,
  });
}

function mergeCpiRecords(
  indexDataset: RawCpiDataset,
  changeDataset: RawCpiDataset,
): CpiRecord[] {
  const recordMap = new Map<string, CpiRecord>();
  const ensureRecord = (period: string, group: string): CpiRecord => {
    const key = `${period}:${group}`;
    let record = recordMap.get(key);
    if (!record) {
      record = { period, group, index: null, change: null };
      recordMap.set(key, record);
    }
    return record;
  };

  for (const entry of indexDataset.records) {
    ensureRecord(entry.period, entry.group).index = entry.value ?? null;
  }

  for (const entry of changeDataset.records) {
    const raw = entry.value;
    const normalized = typeof raw === "number" ? raw / 100 : (raw ?? null);
    ensureRecord(entry.period, entry.group).change = normalized;
  }

  return Array.from(recordMap.values()).sort((a, b) => {
    if (a.period === b.period) return a.group.localeCompare(b.group);
    return a.period.localeCompare(b.period);
  });
}

function collectGroupOptions(
  indexDataset: RawCpiDataset,
  changeDataset: RawCpiDataset,
) {
  const options =
    indexDataset.meta.dimensions.group ?? changeDataset.meta.dimensions.group;
  if (!options || !options.length)
    throw new PxError("cpi: group dimension options missing");
  return options;
}

function collectPeriodStats(records: CpiRecord[]) {
  if (!records.length) throw new PxError("cpi: no CPI records generated");
  const periods = Array.from(new Set(records.map((r) => r.period))).sort();
  return {
    first: periods[0]!,
    last: periods[periods.length - 1]!,
    count: periods.length,
  };
}

function latestTimestamp(values: Array<string | null>): string | null {
  const filtered = values.filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  if (!filtered.length) return null;
  return filtered.sort().at(-1)!;
}

function mergeNotes(
  values: Array<readonly string[] | null | undefined>,
): string[] {
  const merged = new Set<string>();
  values.forEach((list) => list?.forEach((note) => merged.add(note)));
  return Array.from(merged);
}

export async function fetchCpiMonthly(outDir: string, generatedAt: string) {
  const componentResults = await Promise.all([
    fetchCpiComponent(outDir, generatedAt, COMPONENT_SPECS.index),
    fetchCpiComponent(outDir, generatedAt, COMPONENT_SPECS.change),
  ]);
  const [indexDataset, changeDataset] = componentResults;

  const records = mergeCpiRecords(indexDataset, changeDataset);
  const { first, last, count } = collectPeriodStats(records);
  const groupOptions = collectGroupOptions(indexDataset, changeDataset);

  const { description: source, urls: sourceUrls } = describePxSources([
    PATHS.cpi_index,
    PATHS.cpi_change,
  ]);
  const fields = CPI_METRIC_FIELDS.map((field) => ({ ...field }));
  const metrics = fields.map((field) => field.key);

  const meta = createMeta(CPI_DATASET_ID, generatedAt, {
    updated_at: latestTimestamp([
      indexDataset.meta.updated_at,
      changeDataset.meta.updated_at,
    ]),
    time: { key: "period", granularity: "monthly", first, last, count },
    fields,
    metrics,
    dimensions: { group: groupOptions },
    unit: null,
    source,
    source_urls: sourceUrls,
    title: indexDataset.meta.title ?? changeDataset.meta.title ?? null,
    notes: mergeNotes([indexDataset.meta.notes, changeDataset.meta.notes]),
  });

  const dataset = { meta, records };
  await writeJson(outDir, CPI_FILENAME, dataset);
  return dataset;
}
