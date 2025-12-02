import { createDatasetFetcher } from "../client";
import type { ConstructionCostIndexDataset } from "@kosovatools/data-types/construction-cost-index";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

export type { ConstructionCostIndexDataset } from "@kosovatools/data-types";
export async function loadConstructionCostIndexDataset() {
  const data = await fetchDataset<ConstructionCostIndexDataset>(
    "kas_construction_cost_index_quarterly.json",
  );
  return data;
}
