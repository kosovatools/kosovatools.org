import gasolineJson from "../../data/kas_energy_gasoline_monthly.json" with { type: "json" };
import dieselJson from "../../data/kas_energy_diesel_monthly.json" with { type: "json" };
import lngJson from "../../data/kas_energy_lng_monthly.json" with { type: "json" };
import jetJson from "../../data/kas_energy_jet_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

export type FuelBalanceRecord = {
  period: string;
  production: number | null;
  import: number | null;
  export: number | null;
  stock: number | null;
  ready_for_market: number | null;
};

export type FuelKey = "gasoline" | "diesel" | "lng" | "jet";

export const fuelKeys: FuelKey[] = ["gasoline", "diesel", "lng", "jet"];

export type FuelMeta = DatasetMeta & {
  label: string;
};

type FuelDataset = Dataset<FuelBalanceRecord, FuelMeta>;

const datasetMap: Record<FuelKey, FuelDataset> = {
  gasoline: gasolineJson as FuelDataset,
  diesel: dieselJson as FuelDataset,
  lng: lngJson as FuelDataset,
  jet: jetJson as FuelDataset,
};

export const fuelMeta: Record<FuelKey, FuelMeta> = {
  gasoline: datasetMap.gasoline.meta,
  diesel: datasetMap.diesel.meta,
  lng: datasetMap.lng.meta,
  jet: datasetMap.jet.meta,
};

export const fuelBalances: Record<FuelKey, FuelBalanceRecord[]> = {
  gasoline: datasetMap.gasoline.records.slice(),
  diesel: datasetMap.diesel.records.slice(),
  lng: datasetMap.lng.records.slice(),
  jet: datasetMap.jet.records.slice(),
};

export const fuelLabels: Record<FuelKey, string> = {
  gasoline: fuelMeta.gasoline?.label ?? "Gasoline",
  diesel: fuelMeta.diesel?.label ?? "Diesel",
  lng: fuelMeta.lng?.label ?? "LNG",
  jet: fuelMeta.jet?.label ?? "Jet fuel",
};

export type FuelMetric = keyof Pick<
  FuelBalanceRecord,
  "import" | "production" | "export" | "stock" | "ready_for_market"
>;

function resolveMetricLabel(metric: FuelMetric): string {
  for (const meta of Object.values(fuelMeta)) {
    const field = meta?.fields?.find((item) => item.key === metric);
    if (field?.label) {
      return field.label;
    }
  }
  switch (metric) {
    case "import":
      return "Importet";
    case "production":
      return "Prodhimi";
    case "export":
      return "Eksportet";
    case "stock":
      return "Rezervat";
    case "ready_for_market":
      return "Gati për treg";
    default:
      return metric;
  }
}

export const fuelMetricLabels: Record<FuelMetric, string> = {
  import: resolveMetricLabel("import"),
  production: resolveMetricLabel("production"),
  export: resolveMetricLabel("export"),
  stock: resolveMetricLabel("stock"),
  ready_for_market: resolveMetricLabel("ready_for_market"),
};
