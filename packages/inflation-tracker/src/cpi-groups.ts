import { buildUiHierarchy, cpiDataset } from "@workspace/kas-data";
import type { HierarchicalNode } from "@workspace/ui/custom-components/hierarchical-multi-select";

const hierarchy = buildUiHierarchy(
  cpiDataset.meta.dimension_hierarchies.group,
  cpiDataset.meta.dimensions.group,
);

const hierarchyNodes = hierarchy.nodes;
const labelMap = hierarchy.labelMap;
const defaultId =
  hierarchy.defaultId ?? cpiDataset.meta.dimensions.group?.[0]?.key ?? "0";

export const CPI_DEFAULT_GROUP_CODE = defaultId;
export const cpiGroupLabelsByCode = labelMap;

export function buildCpiHierarchicalNodes(): HierarchicalNode[] {
  return hierarchyNodes;
}
