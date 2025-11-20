import { PATHS } from "../../src/types/paths";
import {
  createMeta,
  describePxSources,
  normalizeYM,
  type MetaField,
} from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import { writeJson } from "../lib/io";
import { PxError } from "../lib/pxweb";
import { buildNumberedHierarchy } from "../lib/hierarchy";

type PxDatasetResult<RecordShape extends Record<string, unknown>> = Awaited<
  ReturnType<typeof runPxDatasetPipeline<RecordShape>>
>;

type RawCpiRecord = { period: string; group: string; value: number | null };
type RawCpiDataset = PxDatasetResult<RawCpiRecord>;

import {
  CpiAveragePriceRecord,
  CpiMetric,
  CpiRecord,
  CpiMetaExtras,
} from "../../src/types/cpi";

const CPI_METRIC_FIELDS: ReadonlyArray<MetaField & { key: CpiMetric }> = [
  { key: "index", label: "CPI Indeksi", unit: "index" },
  { key: "change", label: "CPI Ndryshimi (m/m)", unit: "%" },
];

const CPI_DATASET_ID = "kas_cpi_monthly";
const CPI_FILENAME = "kas_cpi_monthly.json";
const CPI_AVERAGE_PRICES_DATASET_ID = "kas_cpi_average_prices_yearly";
const CPI_AVERAGE_PRICES_FILENAME = "kas_cpi_average_prices_yearly.json";

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

const CPI_AVERAGE_PRICE_FIELD = {
  code: "__value__",
  key: "price",
  label: "Çmimet mesatare",
  unit: "€",
} as const;

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
  const groupHierarchy = buildNumberedHierarchy(groupOptions);
  const groupLabelMap = new Map(
    groupHierarchy.map((node) => [node.key, node.label]),
  );
  const normalizedGroupOptions = groupOptions.map((option) => ({
    ...option,
    label: groupLabelMap.get(option.key) ?? option.label,
  }));

  const { description: source, urls: sourceUrls } = describePxSources([
    PATHS.cpi_index,
    PATHS.cpi_change,
  ]);
  const fields = CPI_METRIC_FIELDS.map((field) => ({ ...field }));
  const metrics = fields.map((field) => field.key);

  const meta = createMeta<CpiMetaExtras>(CPI_DATASET_ID, generatedAt, {
    updated_at: latestTimestamp([
      indexDataset.meta.updated_at,
      changeDataset.meta.updated_at,
    ]),
    time: { key: "period", granularity: "monthly", first, last, count },
    fields,
    metrics,
    dimensions: { group: normalizedGroupOptions },
    dimension_hierarchies: { group: groupHierarchy },
    source,
    source_urls: sourceUrls,
    title: indexDataset.meta.title ?? changeDataset.meta.title ?? null,
    notes: mergeNotes([indexDataset.meta.notes, changeDataset.meta.notes]),
  });

  const dataset = { meta, records };
  await writeJson(outDir, CPI_FILENAME, dataset);
  return dataset;
}

export async function fetchCpiAveragePricesYearly(
  outDir: string,
  generatedAt: string,
) {
  return runPxDatasetPipeline<CpiAveragePriceRecord>({
    datasetId: CPI_AVERAGE_PRICES_DATASET_ID,
    filename: CPI_AVERAGE_PRICES_FILENAME,
    parts: PATHS.cpi_average_prices,
    outDir,
    generatedAt,
    timeDimension: {
      code: "viti",
      text: "viti",
      granularity: "yearly",
    },
    axes: [
      {
        code: "artikujt",
        text: "artikujt",
        alias: "article",
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [CPI_AVERAGE_PRICE_FIELD],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const article = axes.article;
      if (!article)
        throw new PxError(
          `${CPI_AVERAGE_PRICES_DATASET_ID}: missing article dimension`,
        );
      return {
        period,
        article: article.code,
        price: values.price ?? null,
      };
    },
    finalizeDataset: ({ records, meta }) => {
      const sortedRecords = [...records].sort((a, b) => {
        if (a.period === b.period) return a.article.localeCompare(b.article);
        return a.period.localeCompare(b.period);
      });
      return { meta, records: sortedRecords };
    },
  });
}
