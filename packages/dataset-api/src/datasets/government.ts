import { createDatasetFetcher } from "../client";
import { type Dataset, type DatasetView } from "../dataset-helpers";
import type {
  GovernmentExpenditureMeta,
  GovernmentExpenditureRecord,
  GovernmentRevenueMeta,
  GovernmentRevenueRecord,
} from "@kosovatools/data-types/government";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

// Government expenditure (quarterly)
export type GovernmentExpenditureDataset = Dataset<
  GovernmentExpenditureRecord,
  GovernmentExpenditureMeta
>;
export type GovernmentExpenditureDatasetView =
  DatasetView<GovernmentExpenditureDataset>;

export async function loadGovernmentExpenditureDataset(): Promise<GovernmentExpenditureDataset> {
  const data = await fetchDataset<GovernmentExpenditureDataset>(
    "kas_government_expenditure_quarterly.json",
  );
  return data;
}

// Government revenue (quarterly)
export type GovernmentRevenueDataset = Dataset<
  GovernmentRevenueRecord,
  GovernmentRevenueMeta
>;
export type GovernmentRevenueDatasetView =
  DatasetView<GovernmentRevenueDataset>;

export async function loadGovernmentRevenueDataset(): Promise<GovernmentRevenueDataset> {
  const data = await fetchDataset<GovernmentRevenueDataset>(
    "kas_government_revenue_quarterly.json",
  );
  return data;
}
