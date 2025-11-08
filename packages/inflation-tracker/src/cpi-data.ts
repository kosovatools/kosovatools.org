import { groupPeriod, type PeriodGrouping } from "@workspace/utils";
import {
  cpiMeta,
  cpiMonthly,
  type CpiMetric,
  type CpiRecord,
} from "@workspace/kas-data";

export type { CpiMetric } from "@workspace/kas-data";

export type CpiSeriesPoint = {
  period: string;
  value: number | null;
};

export type CpiSeries = {
  code: string;
  metric: CpiMetric;
  series: CpiSeriesPoint[];
};

export type CpiGroupNode = {
  code: string;
  name: string;
  label: string;
  level: number;
  parentCode: string | null;
  children: CpiGroupNode[];
};
const sanitizeValue = (value: number | null | undefined): number | null =>
  isFiniteNumber(value) ? value : null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const byPeriod = (a: CpiSeriesPoint, b: CpiSeriesPoint) =>
  a.period.localeCompare(b.period);

const average = (values: number[]): number | null => {
  if (!values.length) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
};

const combinePercentageChanges = (values: number[]): number | null => {
  if (!values.length) return null;
  const product = values.reduce((acc, value) => acc * (1 + value / 100), 1);
  return (product - 1) * 100;
};

const findFirstFinite = (series: readonly CpiSeriesPoint[]) => {
  for (const point of series) {
    if (isFiniteNumber(point.value)) return point.value as number;
  }
  return null;
};

const findLastFinite = (series: readonly CpiSeriesPoint[]) => {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const value = series[index]?.value;
    if (isFiniteNumber(value)) return value as number;
  }
  return null;
};

const groupOptions = cpiMeta.dimensions.group ?? [];

type ParsedGroupOption = {
  code: string;
  label: string;
  name: string;
  path: string;
};

const parsedGroupOptions: ParsedGroupOption[] = groupOptions.map((option) => ({
  code: option.key,
  label: option.label,
  name: extractGroupName(option.label),
  path: normalizeGroupPath(option.label),
}));

const preferredRoot =
  parsedGroupOptions.find((option) => option.path === "00") ??
  parsedGroupOptions[0];
const ROOT_PATH = preferredRoot?.path ?? "00";
export const CPI_DEFAULT_GROUP_CODE =
  preferredRoot?.code ?? groupOptions[0]?.key ?? "0";

const pathToCode = new Map<string, string>();
parsedGroupOptions.forEach((option) => {
  pathToCode.set(option.path, option.code);
});

export const cpiGroupNodesByCode: Record<string, CpiGroupNode> = {};
export const cpiGroupTree: CpiGroupNode[] = [];

parsedGroupOptions.forEach((option) => {
  const segments = option.path.split(".").filter(Boolean);
  const level =
    option.path === ROOT_PATH ? 0 : Math.max(1, segments.length || 1);
  cpiGroupNodesByCode[option.code] = {
    code: option.code,
    name: option.name,
    label: option.label,
    level,
    parentCode: null,
    children: [],
  };
});

parsedGroupOptions.forEach((option) => {
  const node = cpiGroupNodesByCode[option.code];
  if (!node) return;
  const parentCode = resolveParentCode(option.path);
  if (parentCode) {
    const parentNode = cpiGroupNodesByCode[parentCode];
    if (!parentNode) {
      cpiGroupTree.push(node);
      return;
    }
    node.parentCode = parentCode;
    parentNode.children.push(node);
    return;
  }
  cpiGroupTree.push(node);
});

type GroupSeriesMap = Record<CpiMetric, CpiSeriesPoint[]>;
const cpiSeriesByGroup: Record<string, GroupSeriesMap> =
  buildSeriesByGroup(cpiMonthly);

export function getCpiSeriesForMetric(
  metric: CpiMetric,
  code: string,
): CpiSeries | null {
  const entry = cpiSeriesByGroup[code];
  if (!entry) return null;
  return { code, metric, series: entry[metric] ?? [] };
}

export function limitCpiMonthlySeries(
  series: readonly CpiSeriesPoint[],
  range: number | "all",
): CpiSeriesPoint[] {
  if (!series.length) return [];
  if (range === "all" || typeof range !== "number" || range <= 0) {
    return [...series];
  }
  return series.slice(-range);
}

export function aggregateCpiSeries(
  series: readonly CpiSeriesPoint[],
  grouping: PeriodGrouping,
  metric: CpiMetric,
): CpiSeriesPoint[] {
  if (!series.length) return [];
  if (grouping === "monthly") return [...series];

  const grouped = new Map<string, number[]>();
  const order: string[] = [];

  series.forEach((point) => {
    const key = groupPeriod(point.period, grouping);
    if (!grouped.has(key)) {
      grouped.set(key, []);
      order.push(key);
    }
    if (isFiniteNumber(point.value)) {
      grouped.get(key)!.push(point.value);
    }
  });

  return order.map((period) => {
    const values = grouped.get(period) ?? [];
    const value =
      metric === "index" ? average(values) : combinePercentageChanges(values);
    return { period, value };
  });
}

export function computeCpiRangeChange(
  series: readonly CpiSeriesPoint[],
  metric: CpiMetric,
): number | null {
  if (!series.length) return null;
  if (metric === "index") {
    const first = findFirstFinite(series);
    const last = findLastFinite(series);
    if (first == null || last == null || first === 0) return null;
    return ((last - first) / first) * 100;
  }

  const values = series
    .map((point) => point.value)
    .filter((value): value is number => isFiniteNumber(value));
  if (!values.length) return null;
  return combinePercentageChanges(values);
}

function buildSeriesByGroup(records: readonly CpiRecord[]) {
  const map: Record<string, GroupSeriesMap> = {};
  records.forEach((record) => {
    const entry =
      map[record.group] ?? (map[record.group] = { index: [], change: [] });
    entry.index.push({
      period: record.period,
      value: sanitizeValue(record.index),
    });
    entry.change.push({
      period: record.period,
      value: sanitizeValue(record.change),
    });
  });

  Object.values(map).forEach((entry) => {
    entry.index.sort(byPeriod);
    entry.change.sort(byPeriod);
  });
  return map;
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
