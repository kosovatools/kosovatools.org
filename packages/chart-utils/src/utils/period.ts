type MaybeNumber = number | null | undefined;

export type PeriodGrouping = "monthly" | "quarterly" | "yearly" | "seasonal";
export type PeriodFormatter = (period: string) => string;
export type PeriodFormatterOptions = { locale?: string; fallback?: string };

// ==== Constants ====
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

// ==== Small utils ====
const isFiniteNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const toInt = (s: string | undefined): number => Number.parseInt(s ?? "", 10);

// ==== Parsing helpers ====
export function parseYearMonth(
  period: string,
): { year: number; month: number } | null {
  const [y, m] = period.split("-");
  const year = toInt(y);
  const month = toInt(m);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  )
    return null;
  return { year, month };
}

const toSeasonalKey = (period: string): string => {
  const parsed = parseYearMonth(period);
  if (!parsed) return period;
  const { year, month } = parsed;

  let season: keyof typeof SEASON_ORDER;
  let seasonYear = year;
  if (month === 12) {
    season = "winter";
    seasonYear = year + 1;
  } else if (month <= 2) season = "winter";
  else if (month <= 5) season = "spring";
  else if (month <= 8) season = "summer";
  else season = "autumn";

  return `${seasonYear}-${season}`;
};

const stringifyQuarter = (yearStr: string, month: number): string => {
  const y = toInt(yearStr);
  if (!Number.isFinite(y) || !isFiniteNum(month)) return yearStr;
  const q = Math.min(4, Math.max(1, Math.floor((month - 1) / 3) + 1));
  return `${y}-Q${q}`;
};

// ==== Grouping ====
export function groupPeriod(
  period: string,
  grouping: PeriodGrouping = DEFAULT_PERIOD_GROUPING,
): string {
  switch (grouping) {
    case "seasonal":
      return toSeasonalKey(period);
    case "yearly":
      return period.split("-")[0] ?? period;
    case "quarterly": {
      const [y, m] = period.split("-");
      return stringifyQuarter(y ?? period, m ? Number.parseInt(m, 10) : NaN);
    }
    default:
      return period;
  }
}

export function buildGroupedPeriodList(
  periods: string[],
  grouping: PeriodGrouping,
): string[] {
  if (grouping === "monthly") return periods;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of periods) {
    const g = groupPeriod(p, grouping);
    if (!seen.has(g)) {
      seen.add(g);
      out.push(g);
    }
  }
  return out;
}

// ==== Formatting ====
const formatSeasonalPeriod = (period: string): string => {
  const m = SEASONAL_LABEL_PATTERN.exec(period);
  if (!m) return period;
  const [, year, season] = m;
  const label =
    SEASON_LABEL_MAP[season as keyof typeof SEASON_LABEL_MAP] ?? season;
  return `${label} ${year}`;
};

export function formatPeriodLabel(
  period: string,
  grouping: PeriodGrouping,
  options: PeriodFormatterOptions = {},
): string {
  const { locale = "sq", fallback } = options;
  if (!period) return fallback ?? "";

  switch (grouping) {
    case "seasonal": {
      const formatted = formatSeasonalPeriod(period);
      return (formatted || fallback) ?? period;
    }
    case "monthly": {
      const parsed = parseYearMonth(period);
      if (!parsed) return fallback ?? period;
      const fmt = new Intl.DateTimeFormat(locale, {
        month: "short",
        year: "2-digit",
      });
      return fmt.format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));
    }
    case "quarterly": {
      const m = QUARTER_PATTERN.exec(period);
      if (!m) return fallback ?? period;
      const [, y, q] = m;
      return `T${q} ${y}`;
    }
    case "yearly": {
      const y = toInt(period);
      if (!Number.isFinite(y)) return fallback ?? period;
      const fmt = new Intl.DateTimeFormat(locale, { year: "numeric" });
      return fmt.format(new Date(Date.UTC(y, 0, 1)));
    }
    default:
      return period;
  }
}

export function getPeriodFormatter(
  grouping: PeriodGrouping,
  options: PeriodFormatterOptions = {},
): PeriodFormatter {
  return (period: string) => formatPeriodLabel(period, grouping, options);
}

// ==== Sorting ====
type ParsedGroupingKey =
  | { type: "monthly"; year: number; month: number }
  | { type: "quarterly"; year: number; quarter: number }
  | { type: "yearly"; year: number }
  | { type: "seasonal"; year: number; order: number };

function parseGroupedPeriodKey(
  period: string,
  grouping: PeriodGrouping,
): ParsedGroupingKey | null {
  switch (grouping) {
    case "monthly": {
      const p = parseYearMonth(period);
      return p ? { type: "monthly", ...p } : null;
    }
    case "yearly": {
      const y = toInt(period);
      return Number.isFinite(y) ? { type: "yearly", year: y } : null;
    }
    case "quarterly": {
      const m = QUARTER_PATTERN.exec(period);
      if (!m) return null;
      const [, yStr, qStr] = m;
      const y = toInt(yStr);
      const q = toInt(qStr);
      return Number.isFinite(y) && q >= 1 && q <= 4
        ? { type: "quarterly", year: y, quarter: q }
        : null;
    }
    case "seasonal": {
      const m = SEASONAL_LABEL_PATTERN.exec(period);
      if (!m) return null;
      const [, yStr, s] = m;
      const y = toInt(yStr);
      const order = SEASON_ORDER[s as keyof typeof SEASON_ORDER];
      return Number.isFinite(y) && typeof order === "number"
        ? { type: "seasonal", year: y, order }
        : null;
    }
  }
}

export function compareGroupedPeriods(
  a: string,
  b: string,
  grouping: PeriodGrouping,
): number {
  if (a === b) return 0;
  const A = parseGroupedPeriodKey(a, grouping);
  const B = parseGroupedPeriodKey(b, grouping);
  if (!A || !B) return a.localeCompare(b);

  if (A.type !== B.type) return a.localeCompare(b);
  switch (A.type) {
    case "monthly": {
      if (B.type !== "monthly") return a.localeCompare(b);
      return (
        A.year - B.year ||
        A.month - B.month ||
        a.localeCompare(b)
      );
    }
    case "quarterly": {
      if (B.type !== "quarterly") return a.localeCompare(b);
      return (
        A.year - B.year ||
        A.quarter - B.quarter ||
        a.localeCompare(b)
      );
    }
    case "yearly": {
      if (B.type !== "yearly") return a.localeCompare(b);
      return A.year - B.year || a.localeCompare(b);
    }
    case "seasonal": {
      if (B.type !== "seasonal") return a.localeCompare(b);
      return (
        A.year - B.year ||
        A.order - B.order ||
        a.localeCompare(b)
      );
    }
  }
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
  return values.reduce((acc: number, v) => (isFiniteNum(v) ? acc + v : acc), 0);
}

export function meanNumber(values: MaybeNumber[]): number | null {
  const nums = values.filter(isFiniteNum);
  if (!nums.length) return null;
  return sumNumbers(nums) / nums.length;
}

export function groupingToApproxMonths(grouping: PeriodGrouping): number {
  return GROUPING_TO_MONTHS[grouping];
}
