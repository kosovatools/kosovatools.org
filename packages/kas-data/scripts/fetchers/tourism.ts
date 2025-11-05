import { PATHS } from "../lib/constants";
import { PxError, buildValuePairs, type PxVariable } from "../lib/pxweb";
import { normalizeGroupLabel, normalizeYM } from "../lib/utils";
import { runPxDatasetPipeline } from "../pipeline/px-dataset";

type TourismMetric = "visitors" | "nights";

type VisitorGroupSlug = "total" | "local" | "external";

type TourismRegionRecord = {
  period: string;
  region: string;
  visitor_group: VisitorGroupSlug;
} & Record<TourismMetric, number>;

type TourismCountryRecord = {
  period: string;
  country: string;
} & Record<TourismMetric, number>;

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
      const regionCode = regionEntry.code;
      const visitorLabel =
        visitorGroupEntry.metaLabel ||
        visitorGroupEntry.label ||
        visitorGroupEntry.code;
      const visitorSlug = normalizeGroupLabel(visitorLabel) as VisitorGroupSlug;
      return {
        period,
        region: regionCode,
        visitor_group: visitorSlug,
        visitors: values.visitors ?? 0,
        nights: values.nights ?? 0,
      };
    },
    buildMeta: ({ cubeSummary, fields, periods, axes, metrics }) => {
      const regionAxis = axes.find((axis) => axis.alias === "region");
      const visitorAxis = axes.find((axis) => axis.alias === "visitor_group");
      const metricKeys = metrics.flatMap((dimension) =>
        dimension.values.map((value) => value.key ?? value.code),
      );
      const visitorGroups = visitorAxis
        ? Object.fromEntries(
            visitorAxis.values.map((value) => {
              const raw = value.metaLabel || value.label || value.code;
              return [normalizeGroupLabel(raw), raw];
            }),
          )
        : {};
      const regionLabels = regionAxis
        ? Object.fromEntries(
            regionAxis.values.map((value) => [
              value.code,
              value.metaLabel || value.label || value.code,
            ]),
          )
        : {};
      return {
        updatedAt: cubeSummary.updatedAt,
        unit: "people",
        periods,
        fields,
        regions: Object.keys(regionLabels),
        region_labels: regionLabels,
        visitor_groups: Object.keys(visitorGroups),
        visitor_group_labels: visitorGroups,
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
      const countryCode = countryEntry.code;
      return {
        period,
        country: countryCode,
        visitors: values.visitors ?? 0,
        nights: values.nights ?? 0,
      };
    },
    buildMeta: ({ cubeSummary, fields, periods, axes, metrics }) => {
      const countryAxis = axes.find((axis) => axis.alias === "country");
      const metricKeys = metrics.flatMap((dimension) =>
        dimension.values.map((value) => value.key ?? value.code),
      );
      const countryLabels = countryAxis
        ? Object.fromEntries(
            countryAxis.values.map((value) => [
              value.code,
              value.metaLabel || value.label || value.code,
            ]),
          )
        : {};
      return {
        updatedAt: cubeSummary.updatedAt,
        unit: "people",
        periods,
        fields,
        countries: Object.keys(countryLabels),
        country_labels: countryLabels,
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
