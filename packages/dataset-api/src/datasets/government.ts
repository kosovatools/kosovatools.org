import { createDatasetFetcher } from "../client";
import { type DatasetView } from "../dataset-helpers";
import type {
  GovernmentExpenditureDataset,
  GovernmentRevenueDataset,
} from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });



export type {
  GovernmentExpenditureDataset,
  GovernmentRevenueDataset,
} from "@kosovatools/data-types";
export type GovernmentExpenditureDatasetView =
  DatasetView<GovernmentExpenditureDataset>;

export async function loadGovernmentExpenditureDataset(): Promise<GovernmentExpenditureDataset> {
  const data = await fetchDataset<GovernmentExpenditureDataset>(
    "kas_government_expenditure_quarterly.json",
  );
  return data;
}

export type GovernmentRevenueDatasetView =
  DatasetView<GovernmentRevenueDataset>;

export async function loadGovernmentRevenueDataset(): Promise<GovernmentRevenueDataset> {
  const data = await fetchDataset<GovernmentRevenueDataset>(
    "kas_government_revenue_quarterly.json",
  );
  return data;
}
