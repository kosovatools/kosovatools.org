import { PATHS } from "../lib/constants";
import { PxError, buildValuePairs, type PxVariable } from "../lib/pxweb";
import { normalizeGroupLabel, normalizeYM } from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";

export type TourismMetric = "visitors" | "nights";

export type TourismRegionRecord = {
  period: string;
  region: string;
  visitor_group: "total" | "local" | "external";
  visitors: number | null;
  nights: number | null;
};
export type TourismCountryRecord = {
  period: string;
  country: string;
  visitors: number | null;
  nights: number | null;
};

const TOURISM_METRICS = [
  {
    code: "0",
    key: "visitors" as const,
    expectedLabel: "Vizitorët",
    unit: "people",
  },
  {
    code: "1",
    key: "nights" as const,
    expectedLabel: "Netqëndrimet",
    unit: "overnights",
  },
];

function ensureTourismMetrics(variable: PxVariable, datasetId: string) {
  const pairs = buildValuePairs(variable);
  const lookup = new Map(pairs);
  const metrics = [] as typeof TOURISM_METRICS;
  for (const m of TOURISM_METRICS) {
    const label = lookup.get(m.code);
    if (!label)
      throw new PxError(
        `${datasetId}: missing expected metric code "${m.code}"`,
      );
    if (label !== m.expectedLabel)
      console.warn(
        `${datasetId}: metric ${m.code} label changed: "${label}" (expected "${m.expectedLabel}")`,
      );
    metrics.push(m);
  }
  return metrics;
}

export async function fetchTourismRegion(outDir: string, generatedAt: string) {
  const datasetId = "kas_tourism_region_monthly";
  const parts = PATHS.tourism_region;
  return runPxDatasetPipeline<TourismRegionRecord>({
    datasetId,
    filename: "kas_tourism_region_monthly.json",
    parts,
    outDir,
    generatedAt,
    unit: "people",
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    axes: [
      { code: "Rajonet", text: "Rajonet", alias: "region" },
      {
        code: "Vendor/jashtem",
        text: "Vendor/jashtem",
        alias: "visitor_group",
        resolveValues: ({ baseValues }) =>
          baseValues.map((value) => {
            const label = value.metaLabel || value.label || value.code;
            return {
              ...value,
              key: normalizeGroupLabel(label),
            };
          }),
      },
    ],
    metricDimensions: [
      {
        code: "Variabla",
        resolveValues: ({ variable }) => {
          const metrics = ensureTourismMetrics(
            variable as PxVariable,
            datasetId,
          );
          return metrics.map((m) => ({
            code: m.code,
            key: m.key,
            label: m.key === "visitors" ? "Visitors" : "Nights",
            unit: m.unit,
          }));
        },
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const r = axes.region;
      const g = axes.visitor_group;
      if (!r || !g) return null;
      const visitorLabel = g.metaLabel || g.label || g.code;
      const visitorSlug = normalizeGroupLabel(visitorLabel) as
        | "total"
        | "local"
        | "external";
      return {
        period,
        region: r.code,
        visitor_group: visitorSlug,
        visitors: values.visitors ?? null,
        nights: values.nights ?? null,
      };
    },
  });
}

export async function fetchTourismCountry(outDir: string, generatedAt: string) {
  const datasetId = "kas_tourism_country_monthly";
  const parts = PATHS.tourism_country;
  return runPxDatasetPipeline<TourismCountryRecord>({
    datasetId,
    filename: "kas_tourism_country_monthly.json",
    parts,
    outDir,
    generatedAt,
    unit: "people",
    timeDimension: {
      code: "Viti/muaji",
      text: "Viti/muaji",
      toLabel: normalizeYM,
      granularity: "monthly",
    },
    axes: [
      {
        code: "Shtetet",
        text: "Shtetet",
        alias: "country",
        resolveValues: ({ baseValues }) =>
          baseValues
            .filter((v) => v.metaLabel.toLowerCase() !== "external")
            .map((v) => ({
              code: v.code,
              label: v.metaLabel || v.label || v.code,
            })),
      },
    ],
    metricDimensions: [
      {
        code: "Variabla",
        resolveValues: ({ variable }) => {
          const metrics = ensureTourismMetrics(
            variable as PxVariable,
            datasetId,
          );
          return metrics.map((m) => ({
            code: m.code,
            key: m.key,
            label: m.key === "visitors" ? "Visitors" : "Nights",
            unit: m.unit,
          }));
        },
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const c = axes.country;
      if (!c) return null;
      return {
        period,
        country: c.code,
        visitors: values.visitors ?? null,
        nights: values.nights ?? null,
      };
    },
  });
}
