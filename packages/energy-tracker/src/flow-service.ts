import { createDatasetFetcher } from "@workspace/dataset-api";
import { createDataset } from "@workspace/kas-data";

import type {
  EnergyDailyDataset,
  EnergyDailyDatasetView,
  EnergyMonthlyDataset,
  EnergyMonthlyDatasetView,
} from "./types";

const DATASET_PREFIX = ["energy"] as const;
const MONTHLY_FILE = "energy_crossborder_monthly.json";
const DAILY_FILE = "energy_crossborder_daily.json";

const fetchEnergyDataset = createDatasetFetcher(DATASET_PREFIX, {
  label: "energy-flow",
});

let monthlyDatasetPromise: Promise<EnergyMonthlyDatasetView> | null = null;
let dailyDatasetPromise: Promise<EnergyDailyDatasetView> | null = null;

export function getMonthlyPeriodRange(period: string): {
  start: string;
  end: string;
} {
  const [yearPart, monthPart] = period.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error(`Invalid period format: ${period}`);
  }
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

export async function loadMonthlyDataset(): Promise<EnergyMonthlyDatasetView> {
  if (!monthlyDatasetPromise) {
    monthlyDatasetPromise = fetchEnergyDataset<EnergyMonthlyDataset>(
      MONTHLY_FILE,
    ).then((data) => createDataset(data));
  }
  return monthlyDatasetPromise;
}

export async function loadDailyDataset(): Promise<EnergyDailyDatasetView> {
  if (!dailyDatasetPromise) {
    dailyDatasetPromise = fetchEnergyDataset<EnergyDailyDataset>(
      DAILY_FILE,
    ).then((data) => createDataset(data));
  }
  return dailyDatasetPromise;
}
