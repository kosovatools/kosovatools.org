import { createDatasetFetcher } from "../client";
import type {
  DrugPriceRecordsDataset,
  DrugPriceVersionsDataset,
} from "../types/drug-prices";

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

export function checkDrugPriceVersions(): Promise<DrugPriceVersionsDataset> {
  return fetchDrugPrices<DrugPriceVersionsDataset>("versions.json", {
    cache: "no-store",
  });
}
