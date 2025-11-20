import type {
  GdpByActivityCategory,
  GdpByActivityMetric,
  GdpByActivityRecord,
} from "../../src/types/gdp";
import { PATHS } from "../../src/types/paths";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";
import {
  createMeta,
  describePxSources,
  normalizeWhitespace,
  normalizeQuarterPeriod,
  slugifyLabel,
  type MetaField,
} from "../lib/utils";
import { writeJson } from "../lib/io";

const DATASET_ID = "kas_gdp_by_activity_quarterly";
const FILENAME = "kas_gdp_by_activity_quarterly.json";

const METRIC_FIELDS: MetaField[] = [
  { key: "nominal_eur", label: "BPV në çmime aktuale", unit: "EUR" },
  {
    key: "real_eur",
    label: "BPV në çmime të vitit paraprak",
    unit: "EUR",
  },
];

const AGGREGATE_OVERRIDES: Record<
  string,
  { key: string; label: string; category: GdpByActivityCategory }
> = {
  "21": {
    key: "gva_total",
    label: "Bruto vlera e shtuar, gjithsej",
    category: "aggregate",
  },
  "22": {
    key: "net_taxes_on_products",
    label: "Taksa neto në produkte",
    category: "aggregate",
  },
  "23": {
    key: "gdp_total",
    label: "BPV gjithsej",
    category: "aggregate",
  },
};

type GdpMetricRecord<TKey extends string> = {
  period: string;
  activity: string;
  category: GdpByActivityCategory;
} & Record<TKey, number | null>;

type GdpMetricKey = Extract<GdpByActivityMetric, "nominal_eur" | "real_eur">;

function scaleFromThousands(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value * 1000;
}

async function fetchGdpTable<TKey extends string>(
  metricKey: TKey,
  metricLabel: string,
  parts: readonly string[],
  outDir: string,
  generatedAt: string,
  suffix: string,
) {
  return runPxDatasetPipeline<GdpMetricRecord<TKey>>({
    datasetId: `${DATASET_ID}_${suffix}`,
    filename: `${DATASET_ID}_${suffix}.json`,
    parts,
    outDir,
    generatedAt,
    writeFile: false,
    timeDimension: {
      code: "Viti/tremujori",
      text: "Viti/tremujori",
      toLabel: (_code, context) =>
        normalizeQuarterPeriod(
          context.value.metaLabel || context.value.label || _code,
        ),
      granularity: "quarterly",
      sort: (a, b) => a.label.localeCompare(b.label),
    },
    axes: [
      {
        code: "Përshkrimi i aktiviteteve NACE",
        text: "Përshkrimi i aktiviteteve NACE",
        alias: "activity",
        resolveValues: ({ baseValues }) =>
          baseValues.map((entry) => {
            const override = AGGREGATE_OVERRIDES[entry.code];
            const label = normalizeWhitespace(
              override?.label || entry.metaLabel || entry.label || entry.code,
            );
            const key =
              override?.key || slugifyLabel(label) || entry.code || "activity";
            return {
              code: entry.code,
              key,
              label,
              category: override?.category ?? ("activity" as const),
            };
          }),
      },
    ],
    metricDimensions: [
      {
        code: () => null,
        values: [
          {
            code: "__value__",
            key: metricKey,
            label: metricLabel,
            unit: "EUR",
          },
        ],
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const activityAxis = axes.activity;
      if (!activityAxis) return null;

      const metricValue =
        values[metricKey as string] ?? values.__value__ ?? null;

      return {
        period,
        activity: activityAxis.value.key,
        category:
          (activityAxis.value.category as GdpByActivityCategory | undefined) ??
          "activity",
        [metricKey]: scaleFromThousands(metricValue),
      } as GdpMetricRecord<TKey>;
    },
  });
}

export async function fetchGdpByActivityQuarterly(
  outDir: string,
  generatedAt: string,
) {
  const nominal = await fetchGdpTable(
    "nominal_eur",
    METRIC_FIELDS[0]!.label,
    PATHS.gdp_quarterly_nominal,
    outDir,
    generatedAt,
    "nominal",
  );
  const real = await fetchGdpTable(
    "real_eur",
    METRIC_FIELDS[1]!.label,
    PATHS.gdp_quarterly_constant,
    outDir,
    generatedAt,
    "real",
  );

  const recordMap = new Map<string, GdpByActivityRecord>();

  const mergeRecords = <TKey extends GdpMetricKey>(
    records: ReadonlyArray<GdpMetricRecord<TKey>>,
    key: TKey,
  ) => {
    records.forEach((entry) => {
      if (!entry) return;
      const id = `${entry.period}::${entry.activity}`;
      const existing =
        recordMap.get(id) ??
        ({
          period: entry.period,
          activity: entry.activity,
          category: entry.category,
          nominal_eur: null,
          real_eur: null,
        } satisfies GdpByActivityRecord);
      existing[key] = entry[key] ?? null;
      recordMap.set(id, existing);
    });
  };

  mergeRecords(nominal.records, "nominal_eur");
  mergeRecords(real.records, "real_eur");

  const records = Array.from(recordMap.values()).filter(
    (record) => record.nominal_eur !== null || record.real_eur !== null,
  );

  if (!records.length)
    throw new Error(`${DATASET_ID}: no GDP records resolved`);

  records.sort((a, b) =>
    a.period === b.period
      ? a.activity.localeCompare(b.activity)
      : a.period.localeCompare(b.period),
  );

  const periods = Array.from(new Set(records.map((r) => r.period))).sort(
    (a, b) => a.localeCompare(b),
  );

  const updatedAt =
    [nominal.meta.updated_at, real.meta.updated_at]
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  const { description: source, urls: source_urls } = describePxSources([
    PATHS.gdp_quarterly_nominal,
    PATHS.gdp_quarterly_constant,
  ]);

  const aggregates = Object.values(AGGREGATE_OVERRIDES).map(
    (entry) => entry.key,
  );

  const meta = createMeta<{ aggregates: string[] }>(DATASET_ID, generatedAt, {
    updated_at: updatedAt,
    time: {
      key: "period",
      granularity: "quarterly",
      first: periods[0] ?? "",
      last: periods[periods.length - 1] ?? "",
      count: periods.length,
    },
    fields: METRIC_FIELDS,
    metrics: METRIC_FIELDS.map((f) => f.key),
    dimensions: {
      activity: nominal.meta.dimensions.activity ?? [],
    },
    source,
    source_urls,
    notes: [
      "Vlerat burimore paraqiten në mijë EUR; këtu janë shkallëzuar në EUR.",
      "Seria kombinon BPV sipas aktiviteteve ekonomike në çmime aktuale (nominale) dhe në çmime të vitit paraprak (reale).",
      "Rreshtat agregat (Bruto vlera e shtuar, taksat neto në produkte dhe BPV gjithsej) përfshihen për referencë; mos i grumbullo përmes kategorive kur krahaso degët.",
    ],
    aggregates,
  });

  const dataset = { meta, records };
  await writeJson(outDir, FILENAME, dataset);
  return dataset;
}
