import {
  buildUiHierarchy,
  constructionCostIndexDataset,
} from "@workspace/kas-data";
import type { HierarchicalNode } from "@workspace/ui/custom-components/hierarchical-multi-select";

const hierarchy = buildUiHierarchy(
  constructionCostIndexDataset.meta.dimension_hierarchies?.cost_category,
  constructionCostIndexDataset.meta.dimensions.cost_category,
);

const hierarchyNodes = hierarchy.nodes;

export const constructionCostLabelMap = hierarchy.labelMap;

export const CONSTRUCTION_DEFAULT_CATEGORY_CODES = ["9", "0", "4"] as const;
export const CONSTRUCTION_DEFAULT_EXPANDED_CODES = ["9", "0"] as const;

export function buildConstructionCostNodes(): HierarchicalNode[] {
  return hierarchyNodes;
}
