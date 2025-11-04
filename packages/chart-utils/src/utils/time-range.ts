export type TimeRangeOption = number | "all";

export type TimeRangeDefinition<T extends TimeRangeOption = TimeRangeOption> = {
  id: T;
  label: string;
};

export function normalizeTimeRange<T extends TimeRangeOption>(
  value: T | undefined,
  fallback: T,
): T {
  if (value === "all") return "all" as T;
  if (fallback === "all") return fallback;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value as T;
  }
  return fallback;
}

export function monthsFromRange(option: TimeRangeOption): number | undefined {
  if (option === "all") return undefined;
  return option;
}

export const DEFAULT_TIME_RANGE_OPTIONS: ReadonlyArray<TimeRangeDefinition> = [
  { id: 12, label: "12 muaj" },
  { id: 24, label: "24 muaj" },
  { id: 36, label: "3 vjet" },
  { id: 60, label: "5 vjet" },
  { id: 120, label: "10 vjet" },
  { id: "all", label: "Gjithë seria" },
];

export const DEFAULT_TIME_RANGE: TimeRangeOption = 36;
