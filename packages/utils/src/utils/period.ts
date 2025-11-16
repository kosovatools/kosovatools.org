type MaybeNumber = number | null | undefined;
type YearMonthDay = {
  year: number;
  month: number;
  day: number;
};
type IsoWeekKey = {
  year: number;
  week: number;
};

export type PeriodGrouping =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "seasonal";
export type PeriodFormatter = (period: string) => string;
export type PeriodFormatterOptions = { locale?: string; fallback?: string };

// ==== Constants ====
export type PeriodGroupingOption = Readonly<{
  key: PeriodGrouping;
  label: string;
}>;

const PERIOD_GROUPING_OPTION_DEFINITIONS: ReadonlyArray<PeriodGroupingOption> =
  [
    { key: "daily", label: "Ditore" },
    { key: "weekly", label: "Javore" },
    { key: "monthly", label: "Mujor" },
    { key: "quarterly", label: "Tremujor" },
    { key: "seasonal", label: "Stinor" },
    { key: "yearly", label: "Vjetor" },
  ];

const PERIOD_GROUPING_OPTIONS_BY_GRANULARITY: Record<
  PeriodGrouping,
  ReadonlyArray<PeriodGrouping>
> = {
  daily: ["daily", "weekly", "monthly", "quarterly", "seasonal", "yearly"],
  weekly: ["weekly", "monthly", "quarterly", "seasonal", "yearly"],
  monthly: ["monthly", "quarterly", "seasonal", "yearly"],
  quarterly: ["quarterly", "yearly"],
  yearly: ["yearly"],
  seasonal: ["seasonal", "yearly"],
};

const DEFAULT_PERIOD_GROUPING: PeriodGrouping = "monthly";
const QUARTER_PATTERN = /^(\d{4})-Q([1-4])$/;
const SEASONAL_LABEL_PATTERN = /^(\d{4})-(winter|spring|summer|autumn)$/;
const WEEK_KEY_PATTERN = /^(\d{4})-W(\d{1,2})$/i;
const DAY_KEY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  daily: 1 / 30,
  weekly: 7 / 30,
  monthly: 1,
  quarterly: 3,
  seasonal: 3,
  yearly: 12,
};

export function getPeriodGroupingOptions(
  granularity?: PeriodGrouping,
): ReadonlyArray<PeriodGroupingOption> {
  if (!granularity) return PERIOD_GROUPING_OPTION_DEFINITIONS;
  const allowed = PERIOD_GROUPING_OPTIONS_BY_GRANULARITY[granularity];
  if (!allowed) return PERIOD_GROUPING_OPTION_DEFINITIONS;
  return PERIOD_GROUPING_OPTION_DEFINITIONS.filter((option) =>
    allowed.includes(option.key),
  );
}

// ==== Small utils ====
const isFiniteNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const toInt = (s: string | undefined): number => Number.parseInt(s ?? "", 10);

const padNumber = (value: number, length = 2): string =>
  value.toString().padStart(length, "0");
const toUtcDate = (parts: YearMonthDay): Date =>
  new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

const parseYearMonthDay = (period: string): YearMonthDay | null => {
  const match = DAY_KEY_PATTERN.exec(period);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = toInt(y);
  const month = toInt(m);
  const day = toInt(d);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { year, month, day };
};

const parseWeekKey = (period: string): IsoWeekKey | null => {
  const match = WEEK_KEY_PATTERN.exec(period);
  if (!match) return null;
  const [, y, w] = match;
  const year = toInt(y);
  const week = toInt(w);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(week) ||
    week < 1 ||
    week > 53
  ) {
    return null;
  }
  return { year, week };
};

const isoWeekAnchorDate = (key: IsoWeekKey): Date => {
  const { year, week } = key;
  const simple = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = simple.getUTCDay() || 7;
  simple.setUTCDate(simple.getUTCDate() + (week - 1) * 7 + 4 - dayOfWeek);
  return simple;
};

const isoWeekFromDate = (date: Date): IsoWeekKey => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7,
  );
  return { year: d.getUTCFullYear(), week };
};

const deriveWeekKeyFromPeriod = (period: string): IsoWeekKey | null => {
  const week = parseWeekKey(period);
  if (week) return week;
  const day = parseYearMonthDay(period);
  if (!day) return null;
  return isoWeekFromDate(toUtcDate(day));
};

// ==== Parsing helpers ====
export function parseYearMonth(
  period: string,
): { year: number; month: number } | null {
  const [y, m] = period.split("-");
  const year = toInt(y);
  const month = toInt(m);
  if (
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    month >= 1 &&
    month <= 12
  ) {
    return { year, month };
  }
  const week = parseWeekKey(period);
  if (week) {
    const start = isoWeekAnchorDate(week);
    return { year: start.getUTCFullYear(), month: start.getUTCMonth() + 1 };
  }
  return null;
}

const toMonthlyKey = (period: string): string | null => {
  const parsed = parseYearMonth(period);
  if (!parsed) return null;
  return `${parsed.year}-${padNumber(parsed.month)}`;
};

const toWeeklyKey = (period: string): string | null => {
  const week = deriveWeekKeyFromPeriod(period);
  if (!week) return null;
  return `${week.year}-W${padNumber(week.week)}`;
};

const toDailyKey = (period: string): string | null => {
  const parsed = parseYearMonthDay(period);
  if (!parsed) return null;
  return `${parsed.year}-${padNumber(parsed.month)}-${padNumber(parsed.day)}`;
};

const toQuarterKey = (period: string): string | null => {
  const parsed = parseYearMonth(period);
  if (!parsed) return null;
  const quarter = Math.min(
    4,
    Math.max(1, Math.floor((parsed.month - 1) / 3) + 1),
  );
  return `${parsed.year}-Q${quarter}`;
};

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

// ==== Grouping ====
export function groupPeriod(
  period: string,
  grouping: PeriodGrouping = DEFAULT_PERIOD_GROUPING,
): string {
  switch (grouping) {
    case "daily": {
      const key = toDailyKey(period);
      return key ?? period;
    }
    case "weekly": {
      const key = toWeeklyKey(period);
      return key ?? period;
    }
    case "monthly": {
      const key = toMonthlyKey(period);
      return key ?? period;
    }
    case "seasonal":
      return toSeasonalKey(period);
    case "yearly":
      return period.split("-")[0] ?? period;
    case "quarterly": {
      const key = toQuarterKey(period);
      return key ?? period;
    }
    default:
      return period;
  }
}

export function buildGroupedPeriodList(
  periods: string[],
  grouping: PeriodGrouping,
): string[] {
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
    case "daily": {
      const parsed = parseYearMonthDay(period);
      if (!parsed) return fallback ?? period;
      const fmt = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
      return fmt.format(toUtcDate(parsed));
    }
    case "weekly": {
      const week = parseWeekKey(period);
      if (!week) return fallback ?? period;
      return `Java ${week.week} ${week.year}`;
    }
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
  | { type: "daily"; year: number; month: number; day: number }
  | { type: "weekly"; year: number; week: number }
  | { type: "monthly"; year: number; month: number }
  | { type: "quarterly"; year: number; quarter: number }
  | { type: "yearly"; year: number }
  | { type: "seasonal"; year: number; order: number };

function parseGroupedPeriodKey(
  period: string,
  grouping: PeriodGrouping,
): ParsedGroupingKey | null {
  switch (grouping) {
    case "daily": {
      const p = parseYearMonthDay(period);
      return p ? { type: "daily", ...p } : null;
    }
    case "weekly": {
      const week = parseWeekKey(period);
      return week ? { type: "weekly", ...week } : null;
    }
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
    case "daily": {
      if (B.type !== "daily") return a.localeCompare(b);
      return (
        A.year - B.year ||
        A.month - B.month ||
        A.day - B.day ||
        a.localeCompare(b)
      );
    }
    case "weekly": {
      if (B.type !== "weekly") return a.localeCompare(b);
      return A.year - B.year || A.week - B.week || a.localeCompare(b);
    }
    case "monthly": {
      if (B.type !== "monthly") return a.localeCompare(b);
      return A.year - B.year || A.month - B.month || a.localeCompare(b);
    }
    case "quarterly": {
      if (B.type !== "quarterly") return a.localeCompare(b);
      return A.year - B.year || A.quarter - B.quarter || a.localeCompare(b);
    }
    case "yearly": {
      if (B.type !== "yearly") return a.localeCompare(b);
      return A.year - B.year || a.localeCompare(b);
    }
    case "seasonal": {
      if (B.type !== "seasonal") return a.localeCompare(b);
      return A.year - B.year || A.order - B.order || a.localeCompare(b);
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
