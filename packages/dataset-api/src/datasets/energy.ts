import { createDatasetFetcher } from "../client";
import {
  createDataset,
  type Dataset,
  type ToDatasetView,
} from "@workspace/kas-data";
import type {
  EnergyDailyDatasetMeta,
  EnergyDailyRecord,
  EnergyMonthlyDatasetMeta,
  EnergyMonthlyRecord,
} from "../types/energy";

const DATASET_PREFIX = ["energy"] as const;
const MONTHLY_FILE = "energy_crossborder_monthly.json";
const DAILY_FILE = "energy_crossborder_daily.json";

const fetchEnergyDataset = createDatasetFetcher(DATASET_PREFIX, {
  label: "energy-flow",
});

type EnergyMonthlyDataset = Dataset<
  EnergyMonthlyRecord,
  EnergyMonthlyDatasetMeta
>;
type EnergyDailyDataset = Dataset<EnergyDailyRecord, EnergyDailyDatasetMeta>;
export type EnergyMonthlyDatasetView = ToDatasetView<EnergyMonthlyDataset>;
export type EnergyDailyDatasetView = ToDatasetView<EnergyDailyDataset>;

async function fetchDataset<TDataset>(file: string): Promise<TDataset> {
  return fetchEnergyDataset<TDataset>(file);
}

export async function loadMonthlyDataset(): Promise<EnergyMonthlyDatasetView> {
  const data = await fetchDataset<EnergyMonthlyDataset>(MONTHLY_FILE);
  return createDataset(data);
}

export async function loadDailyDataset(): Promise<EnergyDailyDatasetView> {
  const data = await fetchDataset<EnergyDailyDataset>(DAILY_FILE);
  return createDataset(data);
}
