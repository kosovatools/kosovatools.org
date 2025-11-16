import { cpiDataset } from "@workspace/kas-data";
import type { HierarchicalNode } from "@workspace/ui/custom-components/hierarchical-multi-select";

export type CpiGroupNode = {
  code: string;
  label: string;
  name: string;
  level: number;
  parentCode: string | null;
  children: CpiGroupNode[];
};

const groupOptions = cpiDataset.meta.dimensions.group;
const parsedGroups = groupOptions.map((option) => {
  const code = option.key;
  const label = option.label;
  const name = extractGroupName(label);
  const path = normalizeGroupPath(label);
  return { code, label, name, path };
});

const ROOT_PATH =
  parsedGroups.find((option) => option.path === "00")?.path ??
  parsedGroups[0]?.path ??
  "00";

const pathToCode = new Map<string, string>();
parsedGroups.forEach((option) => {
  pathToCode.set(option.path, option.code);
});

export const cpiGroupNodesByCode: Record<string, CpiGroupNode> = {};
export const cpiGroupTree: CpiGroupNode[] = [];

parsedGroups.forEach((option) => {
  const segments = option.path.split(".").filter(Boolean);
  const level = option.path === ROOT_PATH ? 0 : Math.max(1, segments.length);
  cpiGroupNodesByCode[option.code] = {
    code: option.code,
    label: option.label,
    name: option.name,
    level,
    parentCode: null,
    children: [],
  };
});

parsedGroups.forEach((option) => {
  const node = cpiGroupNodesByCode[option.code];
  if (!node) return;
  const parentCode = resolveParentCode(option.path);
  if (parentCode) {
    const parentNode = cpiGroupNodesByCode[parentCode];
    if (parentNode) {
      node.parentCode = parentCode;
      parentNode.children.push(node);
      return;
    }
  }
  cpiGroupTree.push(node);
});

export const CPI_DEFAULT_GROUP_CODE =
  parsedGroups[0]?.code ?? groupOptions[0]?.key ?? "0";

export function buildCpiHierarchicalNodes(): HierarchicalNode[] {
  const convert = (node: CpiGroupNode): HierarchicalNode => ({
    id: node.code,
    label: node.name,
    children: node.children.map(convert),
  });
  return cpiGroupTree.map(convert);
}

function extractGroupName(label: string): string {
  const trimmed = label.trim();
  const [, ...rest] = trimmed.split(/\s+/);
  return rest.join(" ").trim() || trimmed;
}

function normalizeGroupPath(label: string): string {
  const trimmed = label.trim();
  const [rawCode] = trimmed.split(/\s+/);
  const sanitized = (rawCode ?? "").replace(/[^0-9.]/g, "").replace(/\.+$/, "");
  let segments = sanitized.split(".").filter(Boolean);
  if (segments.length >= 2 && segments[0]?.length === 1) {
    const merged = `${segments[0]}${segments[1] ?? ""}`;
    segments = [merged, ...segments.slice(2)];
  }
  if (!segments.length) return "00";
  return segments.join(".");
}

function resolveParentCode(path: string): string | null {
  if (!ROOT_PATH) return null;
  if (path === ROOT_PATH) return null;

  const segments = path.split(".").filter(Boolean);
  if (!segments.length) return pathToCode.get(ROOT_PATH) ?? null;
  if (segments.length === 1) {
    return pathToCode.get(ROOT_PATH) ?? null;
  }

  const cursor = [...segments];
  cursor.pop();
  while (cursor.length) {
    const candidate = cursor.join(".");
    const resolved = pathToCode.get(candidate);
    if (resolved) return resolved;
    cursor.pop();
  }
  return pathToCode.get(ROOT_PATH) ?? null;
}
