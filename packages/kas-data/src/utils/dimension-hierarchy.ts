import type { DimensionHierarchyNode, DimensionOption } from "../types/dataset";

export type DimensionHierarchyUiNode = {
  id: string;
  label: string;
  children?: DimensionHierarchyUiNode[];
};

export type UiHierarchyResult = {
  nodes: DimensionHierarchyUiNode[];
  labelMap: Record<string, string>;
  defaultId: string | null;
};

export function buildUiHierarchy(
  hierarchy: ReadonlyArray<DimensionHierarchyNode> | undefined,
  options: ReadonlyArray<DimensionOption<string>> | undefined,
): UiHierarchyResult {
  if (!hierarchy?.length) {
    const fallbackOptions = options?.filter(Boolean) ?? [];
    const fallbackNodes = fallbackOptions.map<DimensionHierarchyUiNode>(
      (option) => ({
        id: option.key,
        label: option.label,
        children: [],
      }),
    );
    const fallbackLabelMap = Object.fromEntries(
      fallbackOptions.map((option) => [option.key, option.label]),
    );
    return {
      nodes: fallbackNodes,
      labelMap: fallbackLabelMap,
      defaultId: fallbackOptions[0]?.key ?? null,
    };
  }

  const nodeMap = new Map<string, DimensionHierarchyNode>();
  hierarchy.forEach((node) => nodeMap.set(node.key, node));

  const uiNodeCache = new Map<string, DimensionHierarchyUiNode>();

  const toUiNode = (key: string): DimensionHierarchyUiNode | null => {
    if (uiNodeCache.has(key)) return uiNodeCache.get(key)!;
    const node = nodeMap.get(key);
    if (!node) return null;
    const uiChildren = node.children
      .map((childKey) => toUiNode(childKey))
      .filter((child): child is DimensionHierarchyUiNode => Boolean(child));
    const uiNode: DimensionHierarchyUiNode = {
      id: node.key,
      label: node.label,
      children: uiChildren,
    };
    uiNodeCache.set(key, uiNode);
    return uiNode;
  };

  const rootKeys = hierarchy
    .filter((node) => !node.parent)
    .map((node) => node.key);
  const nodes = rootKeys
    .map((key) => toUiNode(key))
    .filter((node): node is DimensionHierarchyUiNode => Boolean(node));

  const labelMap: Record<string, string> = {};
  hierarchy.forEach((node) => {
    labelMap[node.key] = node.label;
  });

  return {
    nodes,
    labelMap,
    defaultId: rootKeys[0] ?? hierarchy[0]?.key ?? null,
  };
}
