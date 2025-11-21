export type TimeRangeOption = number | null;

export type TimeRangeDefinition<T extends TimeRangeOption = TimeRangeOption> =
  Readonly<{
    key: T;
    label: string;
  }>;

export type TimeGranularity = "daily" | "monthly" | "quarterly" | "yearly";

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export function normalizeTimeRange<T extends TimeRangeOption>(
  value: T | undefined,
  fallback: T,
): T {
  if (value === null) return null as T;
  if (fallback === null) return fallback;
  if (isPositiveFiniteNumber(value)) {
    return value as T;
  }
  return fallback;
}

export const DEFAULT_DAILY_TIME_RANGE_OPTIONS: ReadonlyArray<TimeRangeDefinition> =
  [
    // Use day counts that roughly correspond to the yearly-labeled ranges.
    { key: 365, label: "1 vjet" },
    { key: 1095, label: "3 vjet" },
    { key: 1825, label: "5 vjet" },
    { key: 3650, label: "10 vjet" },
    { key: null, label: "Maks." },
  ];

export const DEFAULT_MONTHLY_TIME_RANGE_OPTIONS: ReadonlyArray<TimeRangeDefinition> =
  [
    { key: 12, label: "1 vjet" },
    { key: 36, label: "3 vjet" },
    { key: 60, label: "5 vjet" },
    { key: 120, label: "10 vjet" },
    { key: null, label: "Maks." },
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

const TIME_RANGE_OPTIONS_BY_GRANULARITY: Record<
  TimeGranularity,
  ReadonlyArray<TimeRangeDefinition>
> = {
  daily: DEFAULT_DAILY_TIME_RANGE_OPTIONS,
  monthly: DEFAULT_MONTHLY_TIME_RANGE_OPTIONS,
  quarterly: DEFAULT_QUARTERLY_TIME_RANGE_OPTIONS,
  yearly: DEFAULT_YEARLY_TIME_RANGE_OPTIONS,
};

export type DatasetTimeMetadata = Readonly<{
  granularity: TimeGranularity;
  count: number;
}>;

export function limitTimeRangeOptions(
  timeMeta: DatasetTimeMetadata,
): ReadonlyArray<TimeRangeDefinition> {
  const granularity = timeMeta.granularity;
  const baseOptions = TIME_RANGE_OPTIONS_BY_GRANULARITY[granularity];

  const limited = baseOptions.filter((option) =>
    typeof option.key === "number" ? option.key <= timeMeta.count : true,
  );

  if (limited.some((option) => typeof option.key === "number")) {
    return limited;
  }

  const fallback = baseOptions.filter((option) => option.key == null);
  return fallback.length ? fallback : limited;
}
