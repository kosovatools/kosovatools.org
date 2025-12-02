import { createDatasetFetcher } from "../client";
import type {
  DrugPriceRecordsDataset,
  DrugPriceVersionsDataset,
} from "@kosovatools/data-types";

export type { DrugPriceRecord } from "@kosovatools/data-types";
const DATASET_PREFIX = ["mh", "drug_prices"] as const;
const fetchDrugPrices = createDatasetFetcher(DATASET_PREFIX, {
  label: "drug-prices",
});

export function loadDrugPriceRecords() {
  return fetchDrugPrices<DrugPriceRecordsDataset>("records.json");
}

export function loadDrugPriceVersions() {
  return fetchDrugPrices<DrugPriceVersionsDataset>("versions.json");
}

export function checkDrugPriceVersions() {
  return fetchDrugPrices<DrugPriceVersionsDataset>("versions.json", {
    cache: "no-store",
  });
}
