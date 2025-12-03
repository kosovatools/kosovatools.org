import { createDatasetFetcher } from "../client";
import { type DatasetView } from "../dataset-helpers";
import type {
  EnergyDailyDataset,
  EnergyMonthlyDataset,
} from "@kosovatools/data-types";

const DATASET_PREFIX = ["energy"] as const;
const MONTHLY_FILE = "energy_crossborder_monthly.json";
const DAILY_FILE = "energy_crossborder_daily.json";

const fetchEnergyDataset = createDatasetFetcher(DATASET_PREFIX, {
  label: "energy-flow",
});

export type {
  EnergyMonthlyDataset,
  EnergyDailyDataset,
} from "@kosovatools/data-types";
export type EnergyMonthlyDatasetView = DatasetView<EnergyMonthlyDataset>;
export type EnergyDailyDatasetView = DatasetView<EnergyDailyDataset>;

async function fetchDataset<TDataset>(file: string): Promise<TDataset> {
  return fetchEnergyDataset<TDataset>(file);
}

export async function loadMonthlyDataset(): Promise<EnergyMonthlyDataset> {
  const data = await fetchDataset<EnergyMonthlyDataset>(MONTHLY_FILE);
  return data;
}

export async function loadDailyDataset(): Promise<EnergyDailyDataset> {
  const data = await fetchDataset<EnergyDailyDataset>(DAILY_FILE);
  return data;
}
