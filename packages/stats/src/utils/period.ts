type MaybeNumber = number | null | undefined;

export type PeriodGrouping = "monthly" | "quarterly" | "yearly" | "seasonal";

export type PeriodFormatter = (period: string) => string;

export type PeriodFormatterOptions = {
  locale?: string;
  fallback?: string;
};

export const PERIOD_GROUPING_OPTIONS: ReadonlyArray<{
  id: PeriodGrouping;
  label: string;
}> = [
  { id: "monthly", label: "Mujor" },
  { id: "quarterly", label: "Tremujor" },
  { id: "yearly", label: "Vjetor" },
  { id: "seasonal", label: "Sezonal" },
];

const DEFAULT_PERIOD_GROUPING: PeriodGrouping = "monthly";
const QUARTER_PATTERN = /^(\d{4})-Q([1-4])$/;
const SEASONAL_LABEL_PATTERN = /^(\d{4})-(winter|spring|summer|autumn)$/;
const SEASON_ORDER: Record<"winter" | "spring" | "summer" | "autumn", number> =
  {
    winter: 0,
    spring: 1,
    summer: 2,
    autumn: 3,
  };
const SEASON_LABEL_MAP: Record<keyof typeof SEASON_ORDER, string> = {
  winter: "Dimër",
  spring: "Pranverë",
  summer: "Verë",
  autumn: "Vjeshtë",
};

const GROUPING_TO_MONTHS: Record<PeriodGrouping, number> = {
  monthly: 1,
  quarterly: 3,
  seasonal: 3,
  yearly: 12,
};

function stringifyQuarter(year: string, month: number) {
  const safeMonth = Number.isFinite(month) ? month : NaN;
  if (!Number.isFinite(Number(year)) || !Number.isFinite(safeMonth)) {
    return year;
  }
  const quarter = Math.min(4, Math.max(1, Math.floor((safeMonth - 1) / 3) + 1));
  return `${year}-Q${quarter}`;
}

function toSeasonalKey(period: string): string {
  const [yearStr, monthStr] = period.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return period;
  }

  let season: keyof typeof SEASON_ORDER;
  let seasonYear = year;

  if (month === 12) {
    season = "winter";
    seasonYear = year + 1;
  } else if (month <= 2) {
    season = "winter";
  } else if (month <= 5) {
    season = "spring";
  } else if (month <= 8) {
    season = "summer";
  } else {
    season = "autumn";
  }

  return `${seasonYear}-${season}`;
}

export function parseYearMonth(
  period: string,
): { year: number; month: number } | null {
  const [yearStr, monthStr] = period.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }
  if (month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

export function groupPeriod(
  period: string,
  grouping: PeriodGrouping = DEFAULT_PERIOD_GROUPING,
): string {
  if (grouping === "seasonal") {
    return toSeasonalKey(period);
  }

  if (grouping === "yearly") {
    const [year] = period.split("-");
    return year ?? period;
  }

  if (grouping === "quarterly") {
    const [year, month] = period.split("-");
    const numericMonth = month ? Number.parseInt(month, 10) : NaN;
    return stringifyQuarter(year ?? period, numericMonth);
  }

  return period;
}

export function buildGroupedPeriodList(
  periods: string[],
  grouping: PeriodGrouping,
): string[] {
  if (grouping === "monthly") {
    return periods;
  }

  const seen = new Set<string>();
  const grouped: string[] = [];

  for (const period of periods) {
    const normalized = groupPeriod(period, grouping);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    grouped.push(normalized);
  }

  return grouped;
}

function formatSeasonalPeriod(period: string): string {
  const match = SEASONAL_LABEL_PATTERN.exec(period);
  if (!match) {
    return period;
  }
  const [, year, season] = match;
  if (!season) {
    return period;
  }
  const label =
    SEASON_LABEL_MAP[season as keyof typeof SEASON_LABEL_MAP] ?? season;
  return `${label} ${year}`;
}

export function formatPeriodLabel(
  period: string,
  grouping: PeriodGrouping,
  options: PeriodFormatterOptions = {},
): string {
  const { locale = "sq", fallback } = options;
  if (!period) {
    return fallback ?? "";
  }
  if (grouping === "seasonal") {
    const formatted = formatSeasonalPeriod(period);
    return formatted.length ? formatted : (fallback ?? period);
  }
  if (grouping === "monthly") {
    const parsed = parseYearMonth(period);
    if (!parsed) {
      return fallback ?? period;
    }
    const formatter = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "2-digit",
    });
    return formatter.format(
      new Date(Date.UTC(parsed.year, parsed.month - 1, 1)),
    );
  }
  if (grouping === "quarterly") {
    const match = QUARTER_PATTERN.exec(period);
    if (!match) {
      return fallback ?? period;
    }
    const [, year, quarter] = match;
    return `T${quarter} ${year}`;
  }
  if (grouping === "yearly") {
    const year = Number.parseInt(period, 10);
    if (!Number.isFinite(year)) {
      return fallback ?? period;
    }
    const formatter = new Intl.DateTimeFormat(locale, { year: "numeric" });
    return formatter.format(new Date(Date.UTC(year, 0, 1)));
  }
  return period;
}

export function getPeriodFormatter(
  grouping: PeriodGrouping,
  options: PeriodFormatterOptions = {},
): PeriodFormatter {
  return (period: string) => formatPeriodLabel(period, grouping, options);
}

type ParsedGroupingKey =
  | { type: "monthly"; year: number; month: number }
  | { type: "quarterly"; year: number; quarter: number }
  | { type: "yearly"; year: number }
  | { type: "seasonal"; year: number; order: number };

function parseGroupedPeriodKey(
  period: string,
  grouping: PeriodGrouping,
): ParsedGroupingKey | null {
  if (grouping === "monthly") {
    const parsed = parseYearMonth(period);
    if (!parsed) return null;
    return { type: "monthly", ...parsed };
  }
  if (grouping === "yearly") {
    const year = Number.parseInt(period, 10);
    if (!Number.isFinite(year)) {
      return null;
    }
    return { type: "yearly", year };
  }
  if (grouping === "quarterly") {
    const match = QUARTER_PATTERN.exec(period);
    if (!match) {
      return null;
    }
    const [, yearStr, quarterStr] = match;
    const year = Number.parseInt(yearStr ?? "", 10);
    const quarter = Number.parseInt(quarterStr ?? "", 10);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(quarter) ||
      quarter < 1 ||
      quarter > 4
    ) {
      return null;
    }
    return { type: "quarterly", year, quarter };
  }
  if (grouping === "seasonal") {
    const match = SEASONAL_LABEL_PATTERN.exec(period);
    if (!match) {
      return null;
    }
    const [, yearStr, season] = match;
    const year = Number.parseInt(yearStr ?? "", 10);
    if (!Number.isFinite(year)) {
      return null;
    }
    const order = SEASON_ORDER[season as keyof typeof SEASON_ORDER];
    if (typeof order !== "number") {
      return null;
    }
    return { type: "seasonal", year, order };
  }
  return null;
}

export function compareGroupedPeriods(
  a: string,
  b: string,
  grouping: PeriodGrouping,
): number {
  if (a === b) return 0;
  const parsedA = parseGroupedPeriodKey(a, grouping);
  const parsedB = parseGroupedPeriodKey(b, grouping);
  if (!parsedA || !parsedB) {
    return a.localeCompare(b);
  }
  if (parsedA.type === "monthly" && parsedB.type === "monthly") {
    return (
      parsedA.year - parsedB.year ||
      parsedA.month - parsedB.month ||
      a.localeCompare(b)
    );
  }
  if (parsedA.type === "quarterly" && parsedB.type === "quarterly") {
    return (
      parsedA.year - parsedB.year ||
      parsedA.quarter - parsedB.quarter ||
      a.localeCompare(b)
    );
  }
  if (parsedA.type === "yearly" && parsedB.type === "yearly") {
    return parsedA.year - parsedB.year || a.localeCompare(b);
  }
  if (parsedA.type === "seasonal" && parsedB.type === "seasonal") {
    return (
      parsedA.year - parsedB.year ||
      parsedA.order - parsedB.order ||
      a.localeCompare(b)
    );
  }
  return a.localeCompare(b);
}

export function sortGroupedPeriods(
  periods: Iterable<string>,
  grouping: PeriodGrouping,
): string[] {
  return Array.from(periods).sort((a, b) =>
    compareGroupedPeriods(a, b, grouping),
  );
}

export function sumNumbers(values: MaybeNumber[]): number {
  return values.reduce<number>((acc, value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return acc + value;
    }
    return acc;
  }, 0);
}

export function meanNumber(values: MaybeNumber[]): number | null {
  const filtered = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
  if (!filtered.length) {
    return null;
  }
  const total = filtered.reduce<number>((acc, value) => acc + value, 0);
  return total / filtered.length;
}

export function groupingToApproxMonths(grouping: PeriodGrouping): number {
  return GROUPING_TO_MONTHS[grouping];
}
