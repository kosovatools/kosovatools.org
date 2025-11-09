import { createDatasetFetcher } from "@workspace/dataset-api";

import type {
  DrugPriceRecordsDataset,
  DrugPriceVersionsDataset,
} from "./types";

const DATASET_PREFIX = ["mh", "drug_prices"] as const;
const fetchDrugPrices = createDatasetFetcher(DATASET_PREFIX, {
  label: "drug-prices",
});

export function loadDrugPriceRecords(): Promise<DrugPriceRecordsDataset> {
  return fetchDrugPrices<DrugPriceRecordsDataset>("records.json");
}

export function loadDrugPriceVersions(): Promise<DrugPriceVersionsDataset> {
  return fetchDrugPrices<DrugPriceVersionsDataset>("versions.json");
}
