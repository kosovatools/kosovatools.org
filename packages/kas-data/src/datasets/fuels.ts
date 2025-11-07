import fuelsDatasetJson from "../../data/kas_energy_fuels_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

export type FuelKey = "gasoline" | "diesel" | "lng" | "jet";
export type FuelMetric =
  | "production"
  | "import"
  | "export"
  | "stock"
  | "ready_for_market";

export type FuelBalanceRecord = { period: string; fuel: FuelKey } & Record<
  FuelMetric,
  number | null
>;

type FuelDimensionKey = "fuel";
export type FuelDatasetMeta = DatasetMeta<FuelMetric, FuelDimensionKey>;

type FuelDataset = Dataset<FuelBalanceRecord, FuelDatasetMeta>;
export const fuelDataset = fuelsDatasetJson as FuelDataset;
