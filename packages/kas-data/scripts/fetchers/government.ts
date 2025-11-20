import {
  type GovernmentExpenditureRecord,
  type GovernmentRevenueRecord,
} from "../../src/types/government";
import { PATHS } from "../../src/types/paths";
import {
  createMeta,
  describePxSources,
  normalizeWhitespace,
  normalizeQuarterCode,
  normalizeQuarterPeriod,
  slugifyLabel,
  stripCodePrefix,
  type MetaField,
} from "../lib/utils";
import { type DimensionHierarchyNode } from "../../src/types/dataset";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import { writeJson } from "../lib/io";

const METRIC_FIELD: MetaField = {
  key: "amount_eur",
  label: "Shuma",
  unit: "EUR",
};

const NOTES = [
  "Vlerat burimore duken të raportuara në milion EUR; këtu janë shkallëzuar në EUR.",
];

function scaleFromMillions(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value * 1_000_000;
}

export async function fetchGovernmentExpenditure(
  outDir: string,
  generatedAt: string,
) {
  const datasetId = "kas_government_expenditure_quarterly";
  const filename = "kas_government_expenditure_quarterly.json";
  const { description: source, urls: source_urls } = describePxSources([
    PATHS.government_expenditure_quarterly,
  ]);

  const result = await runPxDatasetPipeline<GovernmentExpenditureRecord>({
    datasetId,
    filename,
    parts: PATHS.government_expenditure_quarterly,
    outDir,
    generatedAt,
    timeDimension: {
      code: "tremujoret",
      text: "tremujoret",
      toLabel: (_code, ctx) =>
        normalizeQuarterPeriod(ctx.value.metaLabel || ctx.value.label || _code),
      granularity: "quarterly",
      sort: (a, b) => a.label.localeCompare(b.label),
    },
    axes: [
      {
        code: "ESA2010 përshkrimi",
        text: "ESA2010 përshkrimi",
        alias: "category",
        toLabel: (_code, ctx) =>
          stripCodePrefix(
            normalizeWhitespace(
              ctx.value.metaLabel || ctx.value.label || _code,
            ),
          ),
        resolveValues: ({ baseValues }) =>
          baseValues
            .filter((entry) => {
              const label = normalizeWhitespace(
                entry.metaLabel || entry.label || entry.code,
              );
              return !/^gjithsej/i.test(label);
            })
            .map((entry) => {
              const rawLabel = normalizeWhitespace(
                entry.metaLabel || entry.label || entry.code,
              );
              const shortLabel = stripCodePrefix(rawLabel);
              const key = slugifyLabel(rawLabel) || entry.code || "category";
              return { code: entry.code, key, label: shortLabel };
            }),
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [{ code: "__value__", ...METRIC_FIELD }],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const category = axes.category;
      if (!category) return null;

      return {
        period,
        category: category.value.key || category.code,
        amount_eur: scaleFromMillions(values.amount_eur ?? values.__value__),
      };
    },
    buildNotes: () => NOTES,
    finalizeDataset: ({ records, meta }) => {
      const sortedRecords = [...records].sort((a, b) =>
        a.period === b.period
          ? a.category.localeCompare(b.category)
          : a.period.localeCompare(b.period),
      );
      const uniquePeriods = Array.from(
        new Set(sortedRecords.map((record) => record.period)),
      ).sort((a, b) => a.localeCompare(b));

      const nextMeta = createMeta(datasetId, generatedAt, {
        ...meta,
        updated_at: meta.updated_at,
        time: {
          ...meta.time,
          first: uniquePeriods[0] ?? meta.time.first,
          last: uniquePeriods[uniquePeriods.length - 1] ?? meta.time.last,
          count: uniquePeriods.length || meta.time.count,
        },
        fields: meta.fields,
        metrics: meta.metrics,
        dimensions: meta.dimensions,
        source,
        source_urls,
        notes: meta.notes ?? NOTES,
      });

      return { meta: nextMeta, records: sortedRecords };
    },
  });

  await writeJson(outDir, filename, result);
  return result;
}

export async function fetchGovernmentRevenue(
  outDir: string,
  generatedAt: string,
) {
  const datasetId = "kas_government_revenue_quarterly";
  const filename = "kas_government_revenue_quarterly.json";
  const { description: source, urls: source_urls } = describePxSources([
    PATHS.government_revenue_quarterly,
  ]);

  const result = await runPxDatasetPipeline<GovernmentRevenueRecord>({
    datasetId,
    filename,
    parts: PATHS.government_revenue_quarterly,
    outDir,
    generatedAt,
    timeDimension: {
      code: "Year",
      text: "Viti",
      granularity: "quarterly",
      toLabel: (_code, ctx) => ctx.value.metaLabel || ctx.value.label || _code,
      sort: (a, b) => Number(a.label) - Number(b.label),
    },
    axes: [
      {
        code: "Period",
        text: "Tremujori",
        alias: "quarter",
        toLabel: (_code, ctx) =>
          normalizeQuarterCode(ctx.value.metaLabel || ctx.value.label || _code),
      },
      {
        code: "Variables",
        text: "Variabla",
        alias: "category",
        resolveValues: ({ baseValues }) =>
          baseValues
            .filter((entry) => {
              const label = normalizeWhitespace(
                entry.metaLabel || entry.label || entry.code,
              );
              return !/^gjithsej/i.test(label);
            })
            .map((entry) => {
              const rawLabel = normalizeWhitespace(
                entry.metaLabel || entry.label || entry.code,
              );
              const shortLabel = stripCodePrefix(rawLabel);
              const key = slugifyLabel(rawLabel) || entry.code || "category";
              return { code: entry.code, key, label: shortLabel };
            }),
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [{ code: "__value__", ...METRIC_FIELD }],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const category = axes.category;
      const quarterAxis = axes.quarter;
      if (!category || !quarterAxis) return null;
      const quarterCode = quarterAxis.label || quarterAxis.metaLabel || "Q1";
      const normalizedPeriod = `${period}-${quarterCode}`;

      return {
        period: normalizedPeriod,
        category: category.value.key || category.code,
        amount_eur: scaleFromMillions(values.amount_eur ?? values.__value__),
      };
    },
    buildNotes: () => NOTES,
    finalizeDataset: ({ records, meta }) => {
      const sortedRecords = [...records].sort((a, b) =>
        a.period === b.period
          ? a.category.localeCompare(b.category)
          : a.period.localeCompare(b.period),
      );

      const uniquePeriods = Array.from(
        new Set(sortedRecords.map((record) => record.period)),
      ).sort((a, b) => a.localeCompare(b));

      const nextMetaBase = createMeta(datasetId, generatedAt, {
        ...meta,
        updated_at: meta.updated_at,
        time: {
          ...meta.time,
          first: uniquePeriods[0] ?? meta.time.first,
          last: uniquePeriods[uniquePeriods.length - 1] ?? meta.time.last,
          count: uniquePeriods.length || meta.time.count,
        },
        fields: meta.fields,
        metrics: meta.metrics,
        dimensions: meta.dimensions,
        source,
        source_urls,
        notes: meta.notes ?? NOTES,
      });

      const hierarchy = buildCategoryHierarchy(
        nextMetaBase.dimensions.category ?? [],
      );

      const nextMeta = {
        ...nextMetaBase,
        dimension_hierarchies: {
          category: hierarchy,
        },
      };

      return { meta: nextMeta, records: sortedRecords };
    },
  });

  await writeJson(outDir, filename, result);
  return result;
}

function buildCategoryHierarchy(
  options: ReadonlyArray<{ key: string; label: string }>,
): DimensionHierarchyNode[] {
  const codeByKey = new Map<string, string>();
  const keyByCode = new Map<string, string>();

  for (const option of options) {
    const codeMatch =
      option.label.match(/^([A-Z]*\d+[A-Z0-9]*)/i) ||
      option.key.match(/^([A-Z]*\d+[A-Z0-9]*)/i);
    const normalizedCode =
      codeMatch && codeMatch[1] ? codeMatch[1].toUpperCase() : null;
    if (normalizedCode) {
      codeByKey.set(option.key, normalizedCode);
      keyByCode.set(normalizedCode, option.key);
    }
  }

  const parentByKey = new Map<string, string | null>();

  for (const option of options) {
    const code = codeByKey.get(option.key);
    if (!code) {
      parentByKey.set(option.key, null);
      continue;
    }
    let parentCode: string | null = null;
    for (const candidate of keyByCode.keys()) {
      if (candidate === code) continue;
      if (code.startsWith(candidate) && candidate.length < code.length) {
        if (!parentCode || candidate.length > parentCode.length) {
          parentCode = candidate;
        }
      }
    }
    parentByKey.set(
      option.key,
      parentCode ? (keyByCode.get(parentCode) ?? null) : null,
    );
  }

  const childrenByKey = new Map<string, Set<string>>();
  for (const [key, parent] of parentByKey.entries()) {
    if (!parent) continue;
    const set = childrenByKey.get(parent) ?? new Set<string>();
    set.add(key);
    childrenByKey.set(parent, set);
  }

  const levelByKey = new Map<string, number>();
  const computeLevel = (key: string): number => {
    if (levelByKey.has(key)) return levelByKey.get(key)!;
    const parent = parentByKey.get(key);
    if (!parent) {
      levelByKey.set(key, 0);
      return 0;
    }
    const level = computeLevel(parent) + 1;
    levelByKey.set(key, level);
    return level;
  };

  return options.map((option) => {
    const parent = parentByKey.get(option.key) ?? null;
    const children = Array.from(childrenByKey.get(option.key) ?? []);
    const shortLabel =
      option.label.replace(/^[A-Z]*\d+[A-Z0-9]*\s*/i, "").trim() ||
      option.label;
    return {
      key: option.key,
      label: shortLabel,
      parent,
      children,
      level: computeLevel(option.key),
    };
  });
}
