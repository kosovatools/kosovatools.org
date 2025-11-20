import { PxError } from "../lib/pxweb";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import { PATHS } from "../../src/types/paths";
import type { ConstructionCostIndexRecord } from "../../src/types/construction-cost-index";
import { buildNumberedHierarchy } from "../lib/hierarchy";
import { normalizeQuarterCode, stripCodePrefix } from "../lib/utils";

const DATASET_ID = "kas_construction_cost_index_quarterly";
const FILENAME = "kas_construction_cost_index_quarterly.json";

const PERIOD_AXIS_VALUES = [
  { code: "4", label: "TM1" },
  { code: "3", label: "TM2" },
  { code: "2", label: "TM3" },
  { code: "1", label: "TM4" },
] as const;

const METRIC_FIELD = {
  code: "__value__",
  key: "index",
  label: "Indeksi i kostos së ndërtimit (2015 = 100)",
  unit: "indeks (2015=100)",
} as const;

export async function fetchConstructionCostIndex(
  outDir: string,
  generatedAt: string,
) {
  return runPxDatasetPipeline<ConstructionCostIndexRecord>({
    datasetId: DATASET_ID,
    filename: FILENAME,
    parts: PATHS.construction_cost_index,
    outDir,
    generatedAt,
    timeDimension: {
      code: "Year",
      text: "Viti",
      granularity: "quarterly",
    },
    axes: [
      {
        code: "Period",
        text: "Periudha",
        alias: "",
        values: PERIOD_AXIS_VALUES.map((entry) => ({
          code: entry.code,
          label: entry.label,
        })),
      },
      {
        code: "Cost category",
        text: "Kategoritë të kostove dhe kodi",
        alias: "cost_category",
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [METRIC_FIELD],
      },
    ],
    createRecord: ({ datasetId, period, axisByCode, values }) => {
      const quarter = axisByCode["Period"];
      const category = axisByCode["Cost category"];
      if (!quarter || !category) {
        throw new PxError(`${datasetId}: missing period or cost axes`);
      }

      const normalizedQuarter = normalizeQuarterCode(
        quarter.metaLabel || quarter.label,
      );
      const normalizedPeriod = `${period}-${normalizedQuarter}`;

      return {
        period: normalizedPeriod,
        cost_category: category.code,
        index: values.index ?? null,
      };
    },
    buildNotes: () => [
      "Seria përfshin vetëm vlerat tremujore TM1–TM4; peshat 'Peshat' përjashtohen sepse përfaqësojnë përqindjen e kostove në total.",
    ],
    finalizeDataset: ({ records, meta }) => {
      if (!records.length) {
        return { meta, records };
      }

      const sortedRecords = [...records].sort((a, b) => {
        if (a.period === b.period) {
          return a.cost_category.localeCompare(b.cost_category);
        }
        return a.period.localeCompare(b.period);
      });

      const activePeriods = new Set<string>();
      for (const record of sortedRecords) {
        if (typeof record.index === "number" && Number.isFinite(record.index)) {
          activePeriods.add(record.period);
        }
      }

      const filteredRecords =
        activePeriods.size === 0
          ? sortedRecords
          : sortedRecords.filter((record) => activePeriods.has(record.period));

      const uniquePeriods = Array.from(
        new Set(filteredRecords.map((record) => record.period)),
      ).sort();

      const firstPeriod = uniquePeriods[0] ?? meta.time.first;
      const lastPeriod =
        uniquePeriods.length > 0
          ? uniquePeriods[uniquePeriods.length - 1]!
          : meta.time.last;

      const nextMetaBase = {
        ...meta,
        time: {
          ...meta.time,
          granularity: "quarterly" as const,
          first: firstPeriod,
          last: lastPeriod,
          count: uniquePeriods.length,
        },
      };

      const sanitizedDimensions = {
        ...nextMetaBase.dimensions,
        cost_category: (nextMetaBase.dimensions.cost_category ?? []).map(
          (option) => {
            const sanitized = sanitizeCostCategoryLabel(option.label);
            return {
              ...option,
              label: formatCostCategoryLabel(option.key, sanitized),
            };
          },
        ),
      };

      const dimensionHierarchy = buildNumberedHierarchy(
        sanitizedDimensions.cost_category ?? [],
      ).map((node) => ({
        ...node,
        label: stripCodePrefix(node.label),
      }));
      const labelMap = new Map(
        dimensionHierarchy.map((node) => [node.key, node.label]),
      );
      const normalizedDimensions = {
        ...sanitizedDimensions,
        cost_category: (sanitizedDimensions.cost_category ?? []).map(
          (option) => ({
            ...option,
            label: labelMap.get(option.key) ?? option.label,
          }),
        ),
      };

      const nextMeta = {
        ...nextMetaBase,
        dimensions: normalizedDimensions,
        dimension_hierarchies: {
          cost_category: dimensionHierarchy,
        },
      };

      return { meta: nextMeta, records: filteredRecords };
    },
  });
}

const COST_CATEGORY_NUMBERING: Record<string, string> = {
  "9": "0",
  "0": "1",
  "1": "1.1",
  "2": "1.2",
  "3": "1.3",
  "4": "2",
  "5": "3",
  "6": "4",
  "7": "5",
  "8": "6",
};

function sanitizeCostCategoryLabel(label: string): string {
  let text = label.trim();
  text = text.replace(
    /\s*\((?:a\s*\+\s*b\s*\+\s*c|1\+2\+3\+4\+5\+6)\)\s*$/gi,
    "",
  );
  text = text.replace(/^[0-9]+\s*[.-]?\s*/, "");
  text = text.replace(/^[a-z]\.\s*/i, "");
  text = text.replace(/\s+/g, " ").trim();
  return text.length ? text : label;
}

function formatCostCategoryLabel(code: string, label: string): string {
  const numbering = COST_CATEGORY_NUMBERING[code];
  if (!numbering) return label;
  return `${numbering} ${label}`.trim();
}
