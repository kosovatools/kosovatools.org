import regionData from "../../data/kas_tourism_region_monthly.json" with { type: "json" };
import countryData from "../../data/kas_tourism_country_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta, DatasetMetaField } from "../types/dataset";

export type TourismMetric = "visitors" | "nights";

export type TourismRegionRecord = {
  period: string;
  region: string;
  visitor_group: "total" | "local" | "external";
  visitors: number;
  nights: number;
};

export type TourismCountryRecord = {
  period: string;
  country: string;
  visitors: number;
  nights: number;
};

export type TourismRegionMeta = DatasetMeta & {
  regions: string[];
  region_labels: Record<string, string>;
  visitor_groups: string[];
  visitor_group_labels: Record<string, string>;
  metrics: TourismMetric[];
};

export type TourismCountryMeta = DatasetMeta & {
  countries: string[];
  country_labels: Record<string, string>;
  metrics: TourismMetric[];
};

type TourismRegionDataset = Dataset<TourismRegionRecord, TourismRegionMeta>;
type TourismCountryDataset = Dataset<TourismCountryRecord, TourismCountryMeta>;

type RawTourismRegionRecord = {
  period?: string;
  region?: string;
  visitor_group?: string;
  visitor_group_label?: string;
  visitors?: number | null;
  nights?: number | null;
};

type RawTourismCountryRecord = {
  period?: string;
  country?: string;
  visitors?: number | null;
  nights?: number | null;
};

type RawTourismRegionMeta = DatasetMeta & {
  regions?: string[];
  region_labels?: Record<string, string>;
  visitor_groups?: string[];
  visitor_group_labels?: Record<string, string>;
  metrics?: string[];
  label?: string;
};

type RawTourismCountryMeta = DatasetMeta & {
  countries?: string[];
  country_labels?: Record<string, string>;
  metrics?: string[];
  label?: string;
};

type RawTourismRegionDataset = Dataset<
  RawTourismRegionRecord,
  RawTourismRegionMeta
>;
type RawTourismCountryDataset = Dataset<
  RawTourismCountryRecord,
  RawTourismCountryMeta
>;

const VISITOR_LABEL_DEFAULTS: Record<
  TourismRegionRecord["visitor_group"],
  string
> = {
  total: "Gjithsej",
  local: "Vendor",
  external: "Të jashtëm",
};

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeVisitorGroup(
  value?: string,
): TourismRegionRecord["visitor_group"] {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.startsWith("local") || normalized.includes("vendor")) {
    return "local";
  }
  if (normalized.includes("external") || normalized.includes("jasht")) {
    return "external";
  }
  return "total";
}

function normalizeMetricKey(metric: unknown): TourismMetric {
  return metric === "nights" ? "nights" : "visitors";
}

function normalizeRegionDataset(
  raw: RawTourismRegionDataset,
): TourismRegionDataset {
  const regionLabelMap: Record<string, string> = {
    ...(raw.meta.region_labels ?? {}),
  };
  const visitorLabelMap: Record<TourismRegionRecord["visitor_group"], string> =
    {
      ...(raw.meta.visitor_group_labels ?? {}),
    } as Record<TourismRegionRecord["visitor_group"], string>;

  const records: TourismRegionRecord[] = (raw.records ?? []).map((entry) => {
    const period = String(entry.period ?? "");
    const region = String(entry.region ?? "");
    if (region && !(region in regionLabelMap)) {
      regionLabelMap[region] = region;
    }
    const visitorGroup = normalizeVisitorGroup(
      entry.visitor_group ?? entry.visitor_group_label,
    );
    const visitorLabel =
      (entry.visitor_group_label && entry.visitor_group_label.trim()) ||
      visitorLabelMap[visitorGroup] ||
      VISITOR_LABEL_DEFAULTS[visitorGroup];
    visitorLabelMap[visitorGroup] = visitorLabel;
    return {
      period,
      region,
      visitor_group: visitorGroup,
      visitors: toNumber(entry.visitors),
      nights: toNumber(entry.nights),
    };
  });

  if (Array.isArray(raw.meta.regions)) {
    for (const region of raw.meta.regions) {
      if (region && !(region in regionLabelMap)) {
        regionLabelMap[region] = region;
      }
    }
  }

  if (Array.isArray(raw.meta.visitor_groups)) {
    for (const group of raw.meta.visitor_groups) {
      const key = normalizeVisitorGroup(group);
      if (!visitorLabelMap[key]) {
        visitorLabelMap[key] = VISITOR_LABEL_DEFAULTS[key];
      }
    }
  }

  const metrics: TourismMetric[] = (
    raw.meta.metrics ?? ["visitors", "nights"]
  ).filter(
    (metric): metric is TourismMetric =>
      metric === "visitors" || metric === "nights",
  );

  const fields: Array<DatasetMetaField & { key: TourismMetric }> = (
    raw.meta.fields ?? []
  ).map((field) => ({
    ...field,
    key: normalizeMetricKey(field.key),
  }));

  return {
    meta: {
      ...raw.meta,
      fields,
      regions: Object.keys(regionLabelMap),
      region_labels: regionLabelMap,
      visitor_groups: Object.keys(visitorLabelMap),
      visitor_group_labels: visitorLabelMap,
      metrics,
    },
    records,
  } as TourismRegionDataset;
}

function normalizeCountryDataset(
  raw: RawTourismCountryDataset,
): TourismCountryDataset {
  const countryLabelMap: Record<string, string> = {
    ...(raw.meta.country_labels ?? {}),
  };

  const records: TourismCountryRecord[] = (raw.records ?? []).map((entry) => {
    const period = String(entry.period ?? "");
    const country = String(entry.country ?? "");
    if (country && !(country in countryLabelMap)) {
      countryLabelMap[country] = country;
    }
    return {
      period,
      country,
      visitors: toNumber(entry.visitors),
      nights: toNumber(entry.nights),
    };
  });

  if (Array.isArray(raw.meta.countries)) {
    for (const country of raw.meta.countries) {
      if (country && !(country in countryLabelMap)) {
        countryLabelMap[country] = country;
      }
    }
  }

  const metrics: TourismMetric[] = (
    raw.meta.metrics ?? ["visitors", "nights"]
  ).filter(
    (metric): metric is TourismMetric =>
      metric === "visitors" || metric === "nights",
  );

  const fields: Array<DatasetMetaField & { key: TourismMetric }> = (
    raw.meta.fields ?? []
  ).map((field) => ({
    ...field,
    key: normalizeMetricKey(field.key),
  }));

  return {
    meta: {
      ...raw.meta,
      fields,
      countries: Object.keys(countryLabelMap),
      country_labels: countryLabelMap,
      metrics,
    },
    records,
  } as TourismCountryDataset;
}

const tourismRegionDataset = normalizeRegionDataset(
  regionData as RawTourismRegionDataset,
);
const tourismCountryDataset = normalizeCountryDataset(
  countryData as RawTourismCountryDataset,
);

export const tourismRegionMeta = tourismRegionDataset.meta;
export const tourismCountryMeta = tourismCountryDataset.meta;

export const tourismByRegion: TourismRegionRecord[] =
  tourismRegionDataset.records;

const AGGREGATE_COUNTRY_LABELS = new Set(["external"]);

export const tourismByCountry: TourismCountryRecord[] =
  tourismCountryDataset.records.filter(({ country }) => {
    const label =
      tourismCountryMeta.country_labels[country]?.toLowerCase() ??
      country.toLowerCase();
    return !AGGREGATE_COUNTRY_LABELS.has(label);
  });
