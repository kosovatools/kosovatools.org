import gasolineDataset from "../../data/kas_energy_gasoline_monthly.json" with { type: "json" };
import dieselDataset from "../../data/kas_energy_diesel_monthly.json" with { type: "json" };
import lngDataset from "../../data/kas_energy_lng_monthly.json" with { type: "json" };
import jetDataset from "../../data/kas_energy_jet_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta, DatasetMetaField } from "../types/dataset";

export type FuelMetric =
  | "production"
  | "import"
  | "export"
  | "stock"
  | "ready_for_market";

export type FuelBalanceRecord = {
  period: string;
} & Record<FuelMetric, number>;

export type FuelKey = "gasoline" | "diesel" | "lng" | "jet";

export const fuelKeys: FuelKey[] = ["gasoline", "diesel", "lng", "jet"];

export type FuelMeta = DatasetMeta & {
  fields: Array<DatasetMetaField & { key: FuelMetric }>;
  label: string;
  metrics: FuelMetric[];
  metric_labels: Record<FuelMetric, string>;
};

type FuelDataset = Dataset<FuelBalanceRecord, FuelMeta>;

const datasets: Record<FuelKey, FuelDataset> = {
  gasoline: gasolineDataset as FuelDataset,
  diesel: dieselDataset as FuelDataset,
  lng: lngDataset as FuelDataset,
  jet: jetDataset as FuelDataset,
};

export const fuelMeta: Record<FuelKey, FuelMeta> = {
  gasoline: datasets.gasoline.meta,
  diesel: datasets.diesel.meta,
  lng: datasets.lng.meta,
  jet: datasets.jet.meta,
};

export const fuelBalances: Record<FuelKey, FuelBalanceRecord[]> = {
  gasoline: datasets.gasoline.records,
  diesel: datasets.diesel.records,
  lng: datasets.lng.records,
  jet: datasets.jet.records,
};

const DEFAULT_LABELS: Record<FuelKey, string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  lng: "LNG",
  jet: "Jet fuel",
};

export const fuelLabels: Record<FuelKey, string> = fuelKeys.reduce(
  (acc, key) => {
    const meta = fuelMeta[key];
    acc[key] = meta.label ?? DEFAULT_LABELS[key];
    return acc;
  },
  {} as Record<FuelKey, string>,
);

const METRIC_ORDER: FuelMetric[] = [
  "ready_for_market",
  "import",
  "production",
  "export",
  "stock",
];

function isFuelMetricKey(value: string): value is FuelMetric {
  return (METRIC_ORDER as string[]).includes(value);
}

function titleizeMetric(metric: FuelMetric): string {
  return metric
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveMetricLabel(metric: FuelMetric): string {
  for (const meta of Object.values(fuelMeta)) {
    const label = meta.metric_labels[metric];
    if (label) {
      return label;
    }
  }
  return titleizeMetric(metric);
}

const discoveredMetrics = (() => {
  const set = new Set<FuelMetric>();
  for (const meta of Object.values(fuelMeta)) {
    meta.metrics.forEach((metric) => {
      if (isFuelMetricKey(metric)) {
        set.add(metric);
      }
    });
  }
  return set;
})();

export const fuelMetrics: FuelMetric[] = (() => {
  const ordered = METRIC_ORDER.filter((metric) =>
    discoveredMetrics.has(metric),
  );
  if (ordered.length) {
    return ordered;
  }
  return METRIC_ORDER.slice();
})();

export const fuelMetricLabels: Record<FuelMetric, string> = METRIC_ORDER.reduce<
  Record<FuelMetric, string>
>(
  (acc, metric) => {
    acc[metric] = resolveMetricLabel(metric);
    return acc;
  },
  {} as Record<FuelMetric, string>,
);
