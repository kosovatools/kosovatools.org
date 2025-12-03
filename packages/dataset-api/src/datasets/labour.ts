import { createDatasetFetcher } from "../client";
import { type DatasetView } from "../dataset-helpers";
import type {
  EmploymentActivityGenderDataset,
  WageLevelsDataset,
} from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });

export type {
  EmploymentActivityGenderDataset,
  WageLevelsDataset,
} from "@kosovatools/data-types";
export type WageLevelsDatasetView = DatasetView<WageLevelsDataset>;

export async function loadWageLevelsDataset(): Promise<WageLevelsDataset> {
  const data = await fetchDataset<WageLevelsDataset>(
    "kas_labour_wages_yearly.json",
  );
  return data;
}

export type EmploymentActivityGenderDatasetView =
  DatasetView<EmploymentActivityGenderDataset>;

export async function loadEmploymentActivityGenderDataset(): Promise<EmploymentActivityGenderDataset> {
  const data = await fetchDataset<EmploymentActivityGenderDataset>(
    "kas_labour_employment_activity_gender_quarterly.json",
  );
  return data;
}
