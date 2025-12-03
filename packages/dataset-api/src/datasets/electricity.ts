import { createDatasetFetcher } from "../client";
import type { ElectricityDataset, FuelDataset } from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });

export type { ElectricityDataset, FuelDataset } from "@kosovatools/data-types";

export async function loadElectricityDataset(): Promise<ElectricityDataset> {
  const data = await fetchDataset<ElectricityDataset>(
    "kas_energy_electricity_monthly.json",
  );
  return data;
}

export async function loadFuelDataset(): Promise<FuelDataset> {
  const data = await fetchDataset<FuelDataset>("kas_energy_fuels_monthly.json");
  return data;
}
