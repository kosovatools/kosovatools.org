import { createDatasetFetcher } from "../client";
import type { LoanInterestDataset } from "@kosovatools/data-types";

const DATASET_PREFIX = ["cbk"] as const;
const DATASET_FILE = "loan_interests.json";

const fetchLoanInterests = createDatasetFetcher(DATASET_PREFIX, {
  label: "cbk-loan-interests",
});

export type { LoanInterestDataset };

let datasetPromise: Promise<LoanInterestDataset> | null = null;

async function fetchDataset(): Promise<LoanInterestDataset> {
  return fetchLoanInterests<LoanInterestDataset>(DATASET_FILE);
}

export async function loadLoanInterestDataset(): Promise<LoanInterestDataset> {
  if (!datasetPromise) {
    datasetPromise = fetchDataset();
  }

  return datasetPromise;
}
