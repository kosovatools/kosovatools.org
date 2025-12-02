import { createDatasetFetcher } from "../client";
import { type Dataset, type DatasetMetaMonthly } from "../dataset-helpers";
import type {
  EnergyMetric,
  EnergyRecord,
  FuelMetric,
  FuelRecord,
} from "@kosovatools/data-types/energy";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

// Electricity (monthly)
type ElectricityMeta = DatasetMetaMonthly<EnergyMetric>;
type ElectricityDataset = Dataset<EnergyRecord, ElectricityMeta>;

export async function loadElectricityDataset(): Promise<ElectricityDataset> {
  const data = await fetchDataset<ElectricityDataset>(
    "kas_energy_electricity_monthly.json",
  );
  return data;
}

// Fuel balances (monthly, combined)
type FuelMeta = DatasetMetaMonthly<FuelMetric, "fuel">;
type FuelDataset = Dataset<FuelRecord, FuelMeta>;

export async function loadFuelDataset(): Promise<FuelDataset> {
  const data = await fetchDataset<FuelDataset>("kas_energy_fuels_monthly.json");
  return data;
}
