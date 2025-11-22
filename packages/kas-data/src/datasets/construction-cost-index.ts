import constructionCostIndex from "../../data/kas_construction_cost_index_quarterly.json" with { type: "json" };
import { createDataset, DatasetView } from "../utils/dataset";
import type { ConstructionCostIndexDataset } from "../types/construction-cost-index";

const constructionCostIndexData =
  constructionCostIndex as ConstructionCostIndexDataset;

export type ConstructionCostIndexDatasetView =
  DatasetView<ConstructionCostIndexDataset>;

export const constructionCostIndexDataset = createDataset(
  constructionCostIndexData,
);
