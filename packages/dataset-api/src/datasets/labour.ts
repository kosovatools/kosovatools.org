import { createDatasetFetcher } from "../client";
import {
  type Dataset,
  type DatasetMetaQuarterly,
  type DatasetMetaYearly,
  type DatasetView,
} from "../dataset-helpers";
import type {
  EmploymentActivityGenderRecord,
  EmploymentMetric,
  WageMetric,
  WageRecord,
} from "@kosovatools/data-types/labour";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

// Wage levels (yearly)
export type WageLevelsMeta = DatasetMetaYearly<WageMetric, "group">;
export type WageLevelsDataset = Dataset<WageRecord, WageLevelsMeta>;
export type WageLevelsDatasetView = DatasetView<WageLevelsDataset>;

export async function loadWageLevelsDataset(): Promise<WageLevelsDataset> {
  const data = await fetchDataset<WageLevelsDataset>(
    "kas_labour_wages_yearly.json",
  );
  return data;
}

// Employment by activity x gender (quarterly)
export type EmploymentActivityGenderMeta = DatasetMetaQuarterly<
  EmploymentMetric,
  "activity" | "gender"
>;
export type EmploymentActivityGenderDataset = Dataset<
  EmploymentActivityGenderRecord,
  EmploymentActivityGenderMeta
>;
export type EmploymentActivityGenderDatasetView =
  DatasetView<EmploymentActivityGenderDataset>;

export async function loadEmploymentActivityGenderDataset(): Promise<EmploymentActivityGenderDataset> {
  const data = await fetchDataset<EmploymentActivityGenderDataset>(
    "kas_labour_employment_activity_gender_quarterly.json",
  );
  return data;
}
