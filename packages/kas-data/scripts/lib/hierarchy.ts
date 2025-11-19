import type { DimensionHierarchyNode } from "../../src/types/dataset";

type DimensionOptionLike = Readonly<{
  key: string;
  label: string;
}>;

type InternalHierarchyNode = {
  key: string;
  label: string;
  short_label: string;
  parent: string | null;
  children: string[];
  level: number;
  numbering: string | null;
};

export function buildNumberedHierarchy(
  options: ReadonlyArray<DimensionOptionLike>,
): DimensionHierarchyNode[] {
  if (!options.length) return [];

  const numberingToKey = new Map<string, string>();
  const nodes = new Map<string, InternalHierarchyNode>();

  for (const option of options) {
    const { numbering, shortLabel } = parseNumberedLabel(option.label);
    if (numbering) numberingToKey.set(numbering, option.key);
    nodes.set(option.key, {
      key: option.key,
      label: option.label,
      short_label: shortLabel,
      parent: null,
      children: [],
      level: 0,
      numbering,
    });
  }

  for (const node of nodes.values()) {
    if (!node.numbering) continue;
    const parentNumber = dropLastSegment(node.numbering);
    if (!parentNumber) continue;
    const parentKey = numberingToKey.get(parentNumber);
    if (!parentKey) continue;
    const parentNode = nodes.get(parentKey);
    if (!parentNode) continue;
    node.parent = parentKey;
    parentNode.children.push(node.key);
  }

  const computeLevel = (
    node: InternalHierarchyNode,
    seen = new Set<string>(),
  ): number => {
    if (node.level !== 0 && node.parent === null) return node.level;
    if (!node.parent) {
      node.level = 0;
      return node.level;
    }
    if (seen.has(node.key)) return node.level;
    seen.add(node.key);
    const parentNode = nodes.get(node.parent);
    if (!parentNode) {
      node.level = 0;
      return node.level;
    }
    node.level = computeLevel(parentNode, seen) + 1;
    return node.level;
  };

  for (const node of nodes.values()) {
    computeLevel(node);
  }

  return Array.from(nodes.values()).map(
    ({ numbering: _, ...rest }) =>
      ({
        ...rest,
        children: [...rest.children],
      }) satisfies DimensionHierarchyNode,
  );
}

function parseNumberedLabel(label: string): {
  numbering: string | null;
  shortLabel: string;
} {
  const trimmed = label.trim();
  const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)*)\s*(.*)$/);
  if (!match) {
    return { numbering: null, shortLabel: trimmed };
  }
  const numbering = match[1] ?? null;
  const shortRaw = match[2] ?? "";
  const cleaned = shortRaw.replace(/^[.\-\s]+/, "").trim();
  return {
    numbering,
    shortLabel: cleaned.length ? cleaned : trimmed,
  };
}

function dropLastSegment(numbering: string): string | null {
  const parts = numbering.split(".").filter(Boolean);
  if (parts.length <= 1) return null;
  parts.pop();
  return parts.join(".");
}
