import { createDatasetFetcher } from "../client";
import { type DatasetView } from "../dataset-helpers";
import type { ElectricityDataset, FuelDataset } from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });

export type { ElectricityDataset, FuelDataset } from "@kosovatools/data-types";
export type ElectricityDatasetView = DatasetView<ElectricityDataset>;

export async function loadKasElectricityDataset() {
  const data = await fetchDataset<ElectricityDataset>(
    "kas_energy_electricity_monthly.json",
  );
  return data;
}

export type FuelDatasetView = DatasetView<FuelDataset>;

export async function loadKasFuelDataset() {
  const data = await fetchDataset<FuelDataset>("kas_energy_fuels_monthly.json");
  return data;
}
