import { createDatasetFetcher } from "../client";
import { createDataset } from "@workspace/kas-data";
import type { LoanInterestDataset, LoanInterestDatasetView } from "../types";

const DATASET_PREFIX = ["cbk"] as const;
const DATASET_FILE = "loan_interests.json";

const fetchLoanInterests = createDatasetFetcher(DATASET_PREFIX, {
  label: "cbk-loan-interests",
});

let datasetPromise: Promise<LoanInterestDatasetView> | null = null;

async function fetchDataset(): Promise<LoanInterestDatasetView> {
  const data = await fetchLoanInterests<LoanInterestDataset>(DATASET_FILE);
  return createDataset(data);
}

export async function loadLoanInterestDataset(): Promise<LoanInterestDatasetView> {
  if (!datasetPromise) {
    datasetPromise = fetchDataset();
  }

  return datasetPromise;
}
