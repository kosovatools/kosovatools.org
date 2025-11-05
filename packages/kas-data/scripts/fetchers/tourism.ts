import { PATHS } from "../lib/constants";
import { PxError, buildValuePairs, type PxVariable } from "../lib/pxweb";
import { normalizeGroupLabel, normalizeYM } from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";

type TourismMetric = "visitors" | "nights";

type TourismRegionRecord = {
  period: string;
  region: string;
  visitor_group: string;
  visitor_group_label: string;
} & Record<TourismMetric, number | null>;

type TourismCountryRecord = {
  period: string;
  country: string;
} & Record<TourismMetric, number | null>;

const TOURISM_METRICS = Object.freeze([
  {
    code: "0",
    key: "visitors" as const,
    expectedLabel: "Vizitorët",
    field: { key: "visitors", label: "Visitors", unit: "people" },
  },
  {
    code: "1",
    key: "nights" as const,
    expectedLabel: "Netqëndrimet",
    field: { key: "nights", label: "Nights", unit: "overnights" },
  },
]);

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
    },
    axes: [
      {
        code: "Rajonet",
        text: "Rajonet",
        alias: "region",
      },
      {
        code: "Vendor/jashtem",
        text: "Vendor/jashtem",
        alias: "visitor_group",
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
          return metrics.map((metric) => ({
            code: metric.code,
            key: metric.key,
            label: metric.field.label,
            unit: metric.field.unit,
          }));
        },
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const regionEntry = axes.region;
      const visitorGroupEntry = axes.visitor_group;
      if (!regionEntry || !visitorGroupEntry) return null;
      const visitorLabel =
        visitorGroupEntry.metaLabel || visitorGroupEntry.label;
      return {
        period,
        region: regionEntry.label,
        visitor_group: normalizeGroupLabel(visitorLabel),
        visitor_group_label: visitorLabel,
        visitors: values.visitors ?? null,
        nights: values.nights ?? null,
      };
    },
    buildMeta: ({ cubeSummary, fields, periods, axes, metrics }) => {
      const regionAxis = axes.find((axis) => axis.alias === "region");
      const visitorAxis = axes.find((axis) => axis.alias === "visitor_group");
      const metricKeys = metrics.flatMap((dimension) =>
        dimension.values.map((value) => value.key ?? value.code),
      );
      const visitorGroups = visitorAxis
        ? visitorAxis.values.map((value) =>
            normalizeGroupLabel(value.metaLabel),
          )
        : [];
      return {
        updatedAt: cubeSummary.updatedAt,
        unit: "people",
        periods,
        fields,
        regions: regionAxis
          ? regionAxis.values.map((value) => value.metaLabel)
          : [],
        visitor_groups: visitorGroups,
        metrics: metricKeys,
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
    },
    axes: [
      {
        code: "Shtetet",
        text: "Shtetet",
        alias: "country",
        resolveValues: ({ baseValues }) =>
          baseValues
            .filter((value) => value.metaLabel.toLowerCase() !== "external")
            .map((value) => ({
              code: value.code,
              label: value.label,
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
          return metrics.map((metric) => ({
            code: metric.code,
            key: metric.key,
            label: metric.field.label,
            unit: metric.field.unit,
          }));
        },
      },
    ],
    createRecord: ({ period, axes, values }) => {
      const countryEntry = axes.country;
      if (!countryEntry) return null;
      return {
        period,
        country: countryEntry.label,
        visitors: values.visitors ?? null,
        nights: values.nights ?? null,
      };
    },
    buildMeta: ({ cubeSummary, fields, periods, axes, metrics }) => {
      const countryAxis = axes.find((axis) => axis.alias === "country");
      const metricKeys = metrics.flatMap((dimension) =>
        dimension.values.map((value) => value.key ?? value.code),
      );
      return {
        updatedAt: cubeSummary.updatedAt,
        unit: "people",
        periods,
        fields,
        countries: countryAxis
          ? countryAxis.values.map((value) => value.metaLabel)
          : [],
        metrics: metricKeys,
      };
    },
  });
}

function ensureTourismMetrics(variable: PxVariable, datasetId: string) {
  const pairs = buildValuePairs(variable);
  const lookup = new Map(pairs);
  const metrics = [];
  for (const metric of TOURISM_METRICS) {
    const label = lookup.get(metric.code);
    if (!label) {
      throw new PxError(
        `${datasetId}: missing expected metric code "${metric.code}" (${metric.expectedLabel})`,
      );
    }
    if (label !== metric.expectedLabel) {
      throw new PxError(
        `${datasetId}: metric "${metric.code}" label changed (expected "${metric.expectedLabel}" got "${label}")`,
      );
    }
    metrics.push(metric);
  }
  return metrics;
}
