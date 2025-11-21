import type { PeriodGrouping } from "./period";

export type TimeRangeOption = number | null;

export type TimeRangeDefinition<T extends TimeRangeOption = TimeRangeOption> = {
  key: T;
  label: string;
};

export function normalizeTimeRange<T extends TimeRangeOption>(
  value: T | undefined,
  fallback: T,
): T {
  if (value === null) return null as T;
  if (fallback === null) return fallback;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value as T;
  }
  return fallback;
}

export const DEFAULT_TIME_RANGE_OPTIONS: ReadonlyArray<TimeRangeDefinition> = [
  { key: 12, label: "1 vjet" },
  { key: 36, label: "3 vjet" },
  { key: 60, label: "5 vjet" },
  { key: 120, label: "10 vjet" },
  { key: null, label: "Gjithë seria" },
];

export const DEFAULT_YEARLY_TIME_RANGE_OPTIONS: ReadonlyArray<TimeRangeDefinition> =
  [
    { key: 1, label: "1 vjet" },
    { key: 3, label: "3 vjet" },
    { key: 5, label: "5 vjet" },
    { key: 10, label: "10 vjet" },
    { key: null, label: "Maks." },
  ];

export const DEFAULT_QUARTERLY_TIME_RANGE_OPTIONS: ReadonlyArray<TimeRangeDefinition> =
  [
    { key: 8, label: "1 vjet" },
    { key: 12, label: "3 vjet" },
    { key: 20, label: "5 vjet" },
    { key: 40, label: "10 vjet" },
    { key: null, label: "Maks." },
  ];

export const DEFAULT_TIME_RANGE: TimeRangeOption = 36;

export type DatasetTimeMetadata = Readonly<{
  granularity?: PeriodGrouping | null;
  count?: number | null;
}>;

export function limitTimeRangeOptions(
  timeMeta: DatasetTimeMetadata | null | undefined,
): ReadonlyArray<TimeRangeDefinition> {
  const granularity = timeMeta?.granularity;
  const baseOptions = getDefaultTimeRangeOptions(granularity);

  if (
    !granularity ||
    (granularity !== "monthly" &&
      granularity !== "quarterly" &&
      granularity !== "yearly")
  ) {
    return baseOptions;
  }

  const availablePeriods = timeMeta?.count;

  if (
    availablePeriods == null ||
    !Number.isFinite(availablePeriods) ||
    availablePeriods <= 0
  ) {
    return baseOptions;
  }

  const maxPeriods = Math.floor(availablePeriods);
  const limited = baseOptions.filter(
    (option) =>
      option.key == null ||
      (typeof option.key === "number" && option.key <= maxPeriods),
  );

  if (limited.some((option) => typeof option.key === "number")) {
    return limited;
  }

  const fallback = baseOptions.filter((option) => option.key == null);
  return fallback.length ? fallback : limited;
}

function getDefaultTimeRangeOptions(
  granularity: PeriodGrouping | null | undefined,
): ReadonlyArray<TimeRangeDefinition> {
  switch (granularity) {
    case "yearly":
      return DEFAULT_YEARLY_TIME_RANGE_OPTIONS;
    case "quarterly":
      return DEFAULT_QUARTERLY_TIME_RANGE_OPTIONS;
    default:
      return DEFAULT_TIME_RANGE_OPTIONS;
  }
}
