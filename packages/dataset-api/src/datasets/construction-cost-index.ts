import { createDatasetFetcher } from "../client";
import type { ConstructionCostIndexDataset } from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });

export type { ConstructionCostIndexDataset } from "@kosovatools/data-types";
export async function loadConstructionCostIndexDataset() {
  const data = await fetchDataset<ConstructionCostIndexDataset>(
    "kas_construction_cost_index_quarterly.json",
  );
  return data;
}
