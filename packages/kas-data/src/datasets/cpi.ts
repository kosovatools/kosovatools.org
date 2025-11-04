import cpiChange from "../../data/kas_cpi_change_monthly.json" with { type: "json" };
import cpiIndex from "../../data/kas_cpi_index_monthly.json" with { type: "json" };
import {
  groupPeriod,
  groupingToApproxMonths,
  type PeriodGrouping,
} from "@workspace/chart-utils";
import type { DatasetMeta } from "../types/dataset";

type RawCpiPoint = {
  period: string;
  value: number | null;
};

type RawCpiGroup = {
  code: string;
  label: string;
  values: RawCpiPoint[];
};

export type CpiMeta = DatasetMeta & {
  title?: string;
  group_count?: number;
  dimensions?: {
    time: { code: string; label: string };
    group: { code: string; label: string };
  };
};

type CpiDataset = {
  meta: CpiMeta;
  groups: RawCpiGroup[];
};

export type CpiSeriesPoint = {
  period: string;
  value: number | null;
};

export type CpiGroupSeries = {
  code: string;
  label: string;
  prefix: string;
  name: string;
  level: number;
  series: CpiSeriesPoint[];
};

export type CpiGroupNode = {
  code: string;
  label: string;
  prefix: string;
  name: string;
  level: number;
  parentCode: string | null;
  children: CpiGroupNode[];
};

function getGroupPrefixParts(label: string): {
  prefix: string;
  name: string;
  level: number;
} {
  const trimmed = String(label ?? "").trim();
  if (!trimmed) {
    return { prefix: "", name: "", level: 0 };
  }
  const [rawPrefix = "", ...nameParts] = trimmed.split(/\s+/);
  const name = nameParts.join(" ").trim();
  const sanitized = rawPrefix.replace(/[^0-9.]/g, "");
  const normalized = sanitized.replace(/^0\./, "0");
  const segments = normalized
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
  let level = segments.length;
  if (!rawPrefix.includes(".") && segments.length === 1) {
    level = rawPrefix === "00" ? 0 : 1;
  }
  const prefix = normalized.replace(/\.*$/, "");
  return {
    prefix,
    name: name || trimmed,
    level,
  };
}

function normalizeGroup(group: RawCpiGroup): CpiGroupSeries {
  const { prefix, name, level } = getGroupPrefixParts(group.label);
  const series = (group.values ?? [])
    .map((point) => ({
      period: point.period,
      value:
        typeof point.value === "number" && Number.isFinite(point.value)
          ? point.value
          : null,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
  return {
    code: group.code,
    label: group.label,
    prefix,
    name,
    level,
    series,
  };
}

function buildCpiGroups(groups: RawCpiGroup[]): CpiGroupSeries[] {
  return Array.isArray(groups) ? groups.map(normalizeGroup) : [];
}

const cpiChangeDataset = cpiChange as CpiDataset;
const cpiIndexDataset = cpiIndex as CpiDataset;

export const cpiChangeMeta = cpiChangeDataset.meta;
export const cpiIndexMeta = cpiIndexDataset.meta;

export const cpiChangeMonthlyGroups = buildCpiGroups(cpiChangeDataset.groups);

export const cpiIndexMonthlyGroups = buildCpiGroups(cpiIndexDataset.groups);

export const cpiGroupsByCode: Record<string, CpiGroupSeries> =
  cpiIndexMonthlyGroups.reduce(
    (acc, group) => {
      if (group.code && !(group.code in acc)) {
        acc[group.code] = group;
      }
      return acc;
    },
    {} as Record<string, CpiGroupSeries>,
  );

export const cpiChangeGroupsByCode: Record<string, CpiGroupSeries> =
  cpiChangeMonthlyGroups.reduce(
    (acc, group) => {
      if (group.code && !(group.code in acc)) {
        acc[group.code] = group;
      }
      return acc;
    },
    {} as Record<string, CpiGroupSeries>,
  );

type MutableCpiNode = CpiGroupNode & { children: MutableCpiNode[] };

function resolveParentPrefix(prefix: string, level: number): string | null {
  if (!prefix || level <= 0) {
    return null;
  }
  if (prefix === "00") {
    return null;
  }
  const segments = prefix
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!segments.length) {
    return null;
  }
  if (segments.length === 1) {
    return "00";
  }
  const parentSegments = segments.slice(0, -1);
  if (!parentSegments.length) {
    return "00";
  }
  let parentPrefix = parentSegments.join(".");
  if (!parentPrefix.includes(".") && parentPrefix.length === 1) {
    parentPrefix = parentPrefix.padStart(2, "0");
  }
  if (!parentPrefix.includes(".") && parentPrefix === "0") {
    return "00";
  }
  return parentPrefix;
}

function buildGroupTree(groups: CpiGroupSeries[]): {
  roots: CpiGroupNode[];
  nodeByCode: Map<string, CpiGroupNode>;
  descendantsByCode: Map<string, string[]>;
} {
  const prefixToCode = new Map<string, string>();
  for (const group of groups) {
    if (group.prefix) {
      prefixToCode.set(group.prefix, group.code);
    }
  }

  const mutableNodes = new Map<string, MutableCpiNode>();
  for (const group of groups) {
    const node: MutableCpiNode = {
      code: group.code,
      label: group.label,
      prefix: group.prefix,
      name: group.name,
      level: group.level,
      parentCode: null,
      children: [],
    };
    mutableNodes.set(group.code, node);
  }

  const roots: MutableCpiNode[] = [];
  for (const group of groups) {
    const node = mutableNodes.get(group.code);
    if (!node) continue;
    const parentPrefix = resolveParentPrefix(group.prefix, group.level);
    const parentCode = parentPrefix
      ? (prefixToCode.get(parentPrefix) ?? null)
      : null;
    node.parentCode = parentCode;
    if (parentCode && mutableNodes.has(parentCode)) {
      mutableNodes.get(parentCode)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (nodes: MutableCpiNode[]) => {
    nodes.sort(
      (a, b) =>
        a.prefix.localeCompare(b.prefix, undefined, { numeric: true }) ||
        a.name.localeCompare(b.name, "sq"),
    );
    nodes.forEach((child) => sortChildren(child.children));
  };
  sortChildren(roots);

  const nodeByCode = new Map<string, CpiGroupNode>();
  const descendantsByCode = new Map<string, string[]>();

  const collectDescendants = (node: MutableCpiNode): string[] => {
    const descendants: string[] = [];
    for (const child of node.children) {
      descendants.push(child.code);
      descendants.push(...collectDescendants(child));
    }
    descendantsByCode.set(node.code, descendants);
    return descendants;
  };

  const finalizeNode = (node: MutableCpiNode): CpiGroupNode => {
    const finalizedChildren = node.children.map(finalizeNode);
    const finalized: CpiGroupNode = {
      code: node.code,
      label: node.label,
      prefix: node.prefix,
      name: node.name,
      level: node.level,
      parentCode: node.parentCode,
      children: finalizedChildren,
    };
    nodeByCode.set(finalized.code, finalized);
    collectDescendants(node);
    return finalized;
  };

  const finalizedRoots = roots.map(finalizeNode);
  const sortedRoots = finalizedRoots.sort((a, b) =>
    a.prefix.localeCompare(b.prefix),
  );

  return {
    roots: sortedRoots,
    nodeByCode,
    descendantsByCode,
  };
}

const {
  roots: cpiGroupTreeRoots,
  nodeByCode: cpiNodeByCode,
  descendantsByCode,
} = buildGroupTree(cpiIndexMonthlyGroups);

export const cpiGroupTree = cpiGroupTreeRoots;

export const cpiGroupNodesByCode: Record<string, CpiGroupNode> = Array.from(
  cpiNodeByCode.values(),
).reduce(
  (acc, node) => {
    acc[node.code] = node;
    return acc;
  },
  {} as Record<string, CpiGroupNode>,
);

export function getCpiGroupDescendantCodes(
  code: string,
  { includeSelf = false }: { includeSelf?: boolean } = {},
): string[] {
  const descendants = descendantsByCode.get(code) ?? [];
  if (includeSelf) {
    return [code, ...descendants];
  }
  return descendants.slice();
}

export const CPI_DEFAULT_GROUP_CODE = "0";

export function getCpiChangeSeries(
  groupCode: string,
): CpiGroupSeries | undefined {
  return cpiChangeGroupsByCode[groupCode];
}

export function getCpiIndexSeries(
  groupCode: string,
): CpiGroupSeries | undefined {
  return cpiGroupsByCode[groupCode];
}

export type CpiMetric = "index" | "change";

export function getCpiSeriesForMetric(
  metric: CpiMetric,
  groupCode: string,
): CpiGroupSeries | undefined {
  return metric === "index"
    ? getCpiIndexSeries(groupCode)
    : getCpiChangeSeries(groupCode);
}

function sortSeriesByPeriod(series: CpiSeriesPoint[]): CpiSeriesPoint[] {
  return series.slice().sort((a, b) => a.period.localeCompare(b.period));
}

function average(values: number[]): number | null {
  if (!values.length) {
    return null;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function compoundPercentage(values: number[]): number | null {
  if (!values.length) {
    return null;
  }
  let product = 1;
  for (const value of values) {
    product *= 1 + value / 100;
  }
  return (product - 1) * 100;
}

export function aggregateCpiSeries(
  series: CpiSeriesPoint[],
  grouping: PeriodGrouping,
  metric: CpiMetric,
): CpiSeriesPoint[] {
  if (!series.length) {
    return [];
  }

  const sorted = sortSeriesByPeriod(series);
  const buckets = new Map<string, { order: number; values: number[] }>();

  sorted.forEach((point, index) => {
    const periodKey = groupPeriod(point.period, grouping);
    if (!buckets.has(periodKey)) {
      buckets.set(periodKey, { order: index, values: [] });
    }
    const bucket = buckets.get(periodKey)!;
    if (typeof point.value === "number" && Number.isFinite(point.value)) {
      bucket.values.push(point.value);
    }
  });

  const entries = Array.from(buckets.entries());
  entries.sort(([, a], [, b]) => a.order - b.order);

  return entries.map(([period, bucket]) => {
    const values = bucket.values;
    const aggregated =
      metric === "index" ? average(values) : compoundPercentage(values);
    return {
      period,
      value: aggregated,
    };
  });
}

export function limitCpiSeriesByRange(
  series: CpiSeriesPoint[],
  months: number | "all",
  grouping: PeriodGrouping,
): CpiSeriesPoint[] {
  if (months === "all" || months == null || months <= 0) {
    return sortSeriesByPeriod(series);
  }
  const groupedSize = groupingToApproxMonths(grouping);
  const bucketCount = Math.max(1, Math.ceil(months / Math.max(1, groupedSize)));
  const sorted = sortSeriesByPeriod(series);
  return sorted.slice(-bucketCount);
}

export function limitCpiMonthlySeries(
  series: CpiSeriesPoint[],
  months: number | "all",
): CpiSeriesPoint[] {
  const sorted = sortSeriesByPeriod(series);
  if (months === "all" || months == null || months <= 0) {
    return sorted;
  }
  return sorted.slice(-months);
}

export function computeCpiRangeChange(
  series: CpiSeriesPoint[],
  metric: CpiMetric,
): number | null {
  if (!series.length) {
    return null;
  }
  const sorted = sortSeriesByPeriod(series);
  if (metric === "index") {
    const first = sorted.find(
      (point) =>
        typeof point.value === "number" && Number.isFinite(point.value),
    )?.value;
    const last = [...sorted]
      .reverse()
      .find(
        (point) =>
          typeof point.value === "number" && Number.isFinite(point.value),
      )?.value;
    if (
      first == null ||
      last == null ||
      !Number.isFinite(first) ||
      !Number.isFinite(last) ||
      first === 0
    ) {
      return null;
    }
    return ((last - first) / Math.abs(first)) * 100;
  }

  let product = 1;
  let hasValue = false;
  for (const point of sorted) {
    if (typeof point.value === "number" && Number.isFinite(point.value)) {
      product *= 1 + point.value / 100;
      hasValue = true;
    }
  }
  if (!hasValue) {
    return null;
  }
  return (product - 1) * 100;
}
