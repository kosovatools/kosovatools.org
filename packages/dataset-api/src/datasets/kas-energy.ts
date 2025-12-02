import { createDatasetFetcher } from "../client";
import {
  type Dataset,
  type DatasetMetaMonthly,
  type DatasetView,
} from "../dataset-helpers";
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
export type ElectricityMeta = DatasetMetaMonthly<EnergyMetric>;
export type ElectricityDataset = Dataset<EnergyRecord, ElectricityMeta>;
export type ElectricityDatasetView = DatasetView<ElectricityDataset>;

export async function loadKasElectricityDataset(): Promise<ElectricityDataset> {
  const data = await fetchDataset<ElectricityDataset>(
    "kas_energy_electricity_monthly.json",
  );
  return data;
}

// Fuel balances (monthly, combined)
export type FuelMeta = DatasetMetaMonthly<FuelMetric, "fuel">;
export type FuelDataset = Dataset<FuelRecord, FuelMeta>;
export type FuelDatasetView = DatasetView<FuelDataset>;

export async function loadKasFuelDataset(): Promise<FuelDataset> {
  const data = await fetchDataset<FuelDataset>("kas_energy_fuels_monthly.json");
  return data;
}
