import {
  buildUiHierarchy,
  type DatasetView,
  type CpiDataset,
} from "@workspace/data";
import type { HierarchicalNode } from "@workspace/ui/custom-components/hierarchical-multi-select";

export function buildCpiHierarchy(dataset: DatasetView<CpiDataset>): {
  nodes: HierarchicalNode[];
  labelMap: Record<string, string>;
  defaultId: string;
} {
  const hierarchy = buildUiHierarchy(
    dataset.meta.dimension_hierarchies.group,
    dataset.meta.dimensions.group,
  );

  const defaultId =
    hierarchy.defaultId ?? dataset.meta.dimensions.group?.[0]?.key ?? "0";

  return {
    nodes: hierarchy.nodes,
    labelMap: hierarchy.labelMap,
    defaultId,
  };
}
