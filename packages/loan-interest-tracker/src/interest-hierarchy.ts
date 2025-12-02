import {
  buildUiHierarchy,
  DatasetView,
  LoanInterestDataset,
} from "@workspace/data";
import type { HierarchicalNode } from "@workspace/ui/custom-components/hierarchical-multi-select";

export const SEGMENT_CODES = ["T", "H", "N"] as const;
export const DEFAULT_EXPLORER_CODES = ["T_3", "H_4", "N_2", "N_6"] as const;

type LoanInterestHierarchy = {
  nodes: HierarchicalNode[];
  labelMap: Record<string, string>;
};

export function getLoanInterestHierarchy(
  dataset: DatasetView<LoanInterestDataset>,
): LoanInterestHierarchy {
  const dimensionOptions = dataset.meta.dimensions?.code ?? [];
  const optionLabelMap = Object.fromEntries(
    dimensionOptions.map((option) => [option.key, option.label]),
  );

  const { nodes, labelMap } = buildUiHierarchy(
    dataset.meta.dimension_hierarchies?.code,
    dimensionOptions,
  );

  const mergedLabelMap = { ...labelMap, ...optionLabelMap };

  const applyLabels = (list: HierarchicalNode[]): HierarchicalNode[] =>
    list.map((node) => ({
      ...node,
      label: mergedLabelMap[node.id] ?? node.label,
      children: node.children ? applyLabels(node.children) : undefined,
    }));

  return {
    nodes: applyLabels(nodes),
    labelMap: mergedLabelMap,
  };
}
