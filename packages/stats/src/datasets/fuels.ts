import gasolineData from "../../data/kas_energy_gasoline_monthly.json" with { type: "json" };
import dieselData from "../../data/kas_energy_diesel_monthly.json" with { type: "json" };
import lngData from "../../data/kas_energy_lng_monthly.json" with { type: "json" };
import jetData from "../../data/kas_energy_jet_monthly.json" with { type: "json" };

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

const datasets: Record<FuelKey, FuelBalanceRecord[]> = {
  gasoline: (gasolineData as FuelBalanceRecord[]).slice(0),
  diesel: (dieselData as FuelBalanceRecord[]).slice(0),
  lng: (lngData as FuelBalanceRecord[]).slice(0),
  jet: (jetData as FuelBalanceRecord[]).slice(0),
};

export const fuelBalances: Record<FuelKey, FuelBalanceRecord[]> = datasets;

export const fuelLabels: Record<FuelKey, string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  lng: "LNG",
  jet: "Jet fuel",
};

export type FuelMetric = keyof Pick<
  FuelBalanceRecord,
  "import" | "production" | "export" | "stock" | "ready_for_market"
>;

export const fuelMetricLabels: Record<FuelMetric, string> = {
  import: "Imports",
  production: "Production",
  export: "Exports",
  stock: "Stock",
  ready_for_market: "Ready for market",
};
