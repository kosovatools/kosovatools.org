type MaybeNumber = number | null | undefined;
type YearMonthDay = Readonly<{
  year: number;
  month: number;
  day: number;
}>;
type IsoWeekKey = Readonly<{
  year: number;
  week: number;
}>;
type Season = "winter" | "spring" | "summer" | "autumn";

export type PeriodGrouping =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "seasonal";
export type PeriodFormatter = (period: string) => string;
export type PeriodFormatterOptions = {
  locale?: string;
  fallback?: string;
  timeZoneLabel?: string;
};

// ==== Constants ====
export type PeriodGroupingOption = Readonly<{
  key: PeriodGrouping;
  label: string;
}>;

const PERIOD_GROUPING_OPTION_DEFINITIONS: ReadonlyArray<PeriodGroupingOption> =
  [
    { key: "hourly", label: "Orar" },
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
  hourly: [
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "seasonal",
    "yearly",
  ],
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
const HOUR_KEY_PATTERN = /^(\d{1,2})(?::(\d{1,2}))?$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const SEASON_ORDER: Record<Season, number> = {
  winter: 0,
  spring: 1,
  summer: 2,
  autumn: 3,
};

const SEASON_LABEL_MAP: Record<Season, string> = {
  winter: "Dimër",
  spring: "Pranverë",
  summer: "Verë",
  autumn: "Vjeshtë",
};

const GROUPING_TO_MONTHS: Record<PeriodGrouping, number> = {
  hourly: 1 / (24 * 30),
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
  const allowed =
    granularity && PERIOD_GROUPING_OPTIONS_BY_GRANULARITY[granularity];
  if (!allowed) return PERIOD_GROUPING_OPTION_DEFINITIONS;
  return PERIOD_GROUPING_OPTION_DEFINITIONS.filter((option) =>
    allowed.includes(option.key),
  );
}

// ==== Small utils ====
const isFiniteNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const isWithinRange = (value: number, min: number, max: number): boolean =>
  isFiniteNum(value) && value >= min && value <= max;

const toInt = (s: string | undefined): number => Number.parseInt(s ?? "", 10);

const coalesceKey = (
  key: string | null | undefined,
  fallback: string,
): string => key ?? fallback;

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
    !isFiniteNum(year) ||
    !isWithinRange(month, 1, 12) ||
    !isWithinRange(day, 1, 31)
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
  if (!isFiniteNum(year) || !isWithinRange(week, 1, 53)) {
    return null;
  }
  return { year, week };
};

const parseHourKey = (period: string): number | null => {
  const match = HOUR_KEY_PATTERN.exec(period.trim());
  if (!match) return null;
  const [, h, m] = match;
  const hour = toInt(h);
  const minute = m ? toInt(m) : 0;
  if (!isWithinRange(hour, 0, 23) || !isWithinRange(minute, 0, 59)) {
    return null;
  }
  return hour;
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
  if (isFiniteNum(year) && isWithinRange(month, 1, 12)) {
    return { year, month };
  }
  const week = parseWeekKey(period);
  if (week) {
    const start = isoWeekAnchorDate(week);
    return { year: start.getUTCFullYear(), month: start.getUTCMonth() + 1 };
  }
  return null;
}

type SeasonalMatch = Readonly<{
  year: string;
  season: Season;
}>;

const matchSeasonalPeriod = (period: string): SeasonalMatch | null => {
  const match = SEASONAL_LABEL_PATTERN.exec(period);
  if (!match) return null;
  const year = match[1];
  const season = match[2] as Season | undefined;
  if (!year || !season) return null;
  return { year, season };
};

const parseSeasonalPeriod = (
  period: string,
): { year: number; order: number } | null => {
  const match = matchSeasonalPeriod(period);
  if (!match) return null;
  const year = toInt(match.year);
  const order = SEASON_ORDER[match.season];
  if (!isFiniteNum(year) || typeof order !== "number") return null;
  return { year, order };
};

const parseQuarterPeriod = (
  period: string,
): { year: number; quarter: number } | null => {
  const match = QUARTER_PATTERN.exec(period);
  if (!match) return null;
  const [, yStr, qStr] = match;
  const year = toInt(yStr);
  const quarter = toInt(qStr);
  if (!isFiniteNum(year) || !isWithinRange(quarter, 1, 4)) return null;
  return { year, quarter };
};

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

const toHourlyKey = (period: string): string | null => {
  const hour = parseHourKey(period);
  if (hour == null) return null;
  return padNumber(hour);
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

  let season: Season;
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
    case "hourly":
      return coalesceKey(toHourlyKey(period), period);
    case "daily":
      return coalesceKey(toDailyKey(period), period);
    case "weekly":
      return coalesceKey(toWeeklyKey(period), period);
    case "monthly":
      return coalesceKey(toMonthlyKey(period), period);
    case "seasonal":
      return toSeasonalKey(period);
    case "yearly":
      return coalesceKey(period.split("-")[0], period);
    case "quarterly":
      return coalesceKey(toQuarterKey(period), period);
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
  for (const period of periods) {
    const grouped = groupPeriod(period, grouping);
    if (seen.has(grouped)) continue;
    seen.add(grouped);
    out.push(grouped);
  }
  return out;
}

// ==== Formatting ====
const formatSeasonalPeriod = (period: string): string => {
  const match = matchSeasonalPeriod(period);
  if (!match) return period;
  const label = SEASON_LABEL_MAP[match.season] ?? match.season;
  return `${label} ${match.year}`;
};

export function formatPeriodLabel(
  period: string,
  grouping: PeriodGrouping,
  options: PeriodFormatterOptions = {},
): string {
  const { locale = "sq", fallback } = options;
  const fallbackLabel = fallback ?? period;
  if (!period) return fallback ?? "";

  switch (grouping) {
    case "hourly": {
      const parsed = parseHourKey(period);
      if (parsed == null) return fallbackLabel;
      const base = `${padNumber(parsed)}:00`;
      return options.timeZoneLabel
        ? `${options.timeZoneLabel} ${base}`.trim()
        : base;
    }
    case "daily": {
      const parsed = parseYearMonthDay(period);
      if (!parsed) return fallbackLabel;
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
      if (!week) return fallbackLabel;
      return `Java ${week.week} ${week.year}`;
    }
    case "seasonal": {
      const formatted = formatSeasonalPeriod(period);
      return formatted || fallbackLabel;
    }
    case "monthly": {
      const parsed = parseYearMonth(period);
      if (!parsed) return fallbackLabel;
      const fmt = new Intl.DateTimeFormat(locale, {
        month: "short",
        year: "2-digit",
      });
      return fmt.format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));
    }
    case "quarterly": {
      const parsed = parseQuarterPeriod(period);
      if (!parsed) return fallbackLabel;
      const { quarter, year } = parsed;
      return `T${quarter} ${year}`;
    }
    case "yearly": {
      const y = toInt(period);
      if (!isFiniteNum(y)) return fallbackLabel;
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
  | { type: "hourly"; hour: number }
  | { type: "daily"; year: number; month: number; day: number }
  | { type: "weekly"; year: number; week: number }
  | { type: "monthly"; year: number; month: number }
  | { type: "quarterly"; year: number; quarter: number }
  | { type: "yearly"; year: number }
  | { type: "seasonal"; year: number; order: number };

const compareNumbersWithFallback = (
  lhs: number[],
  rhs: number[],
  fallbackA: string,
  fallbackB: string,
): number => {
  const limit = Math.min(lhs.length, rhs.length);
  for (let i = 0; i < limit; i += 1) {
    const left = lhs[i];
    const right = rhs[i];
    if (left === undefined || right === undefined) {
      return fallbackA.localeCompare(fallbackB);
    }
    const diff = left - right;
    if (diff) return diff;
  }
  return fallbackA.localeCompare(fallbackB);
};

function parseGroupedPeriodKey(
  period: string,
  grouping: PeriodGrouping,
): ParsedGroupingKey | null {
  switch (grouping) {
    case "hourly": {
      const h = parseHourKey(period);
      return h == null ? null : { type: "hourly", hour: h };
    }
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
      return isFiniteNum(y) ? { type: "yearly", year: y } : null;
    }
    case "quarterly": {
      const parsed = parseQuarterPeriod(period);
      return parsed
        ? { type: "quarterly", year: parsed.year, quarter: parsed.quarter }
        : null;
    }
    case "seasonal": {
      const parsed = parseSeasonalPeriod(period);
      return parsed
        ? { type: "seasonal", year: parsed.year, order: parsed.order }
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
    case "hourly": {
      const other = B as Extract<ParsedGroupingKey, { type: "hourly" }>;
      return compareNumbersWithFallback([A.hour], [other.hour], a, b);
    }
    case "daily": {
      const other = B as Extract<ParsedGroupingKey, { type: "daily" }>;
      return compareNumbersWithFallback(
        [A.year, A.month, A.day],
        [other.year, other.month, other.day],
        a,
        b,
      );
    }
    case "weekly": {
      const other = B as Extract<ParsedGroupingKey, { type: "weekly" }>;
      return compareNumbersWithFallback(
        [A.year, A.week],
        [other.year, other.week],
        a,
        b,
      );
    }
    case "monthly": {
      const other = B as Extract<ParsedGroupingKey, { type: "monthly" }>;
      return compareNumbersWithFallback(
        [A.year, A.month],
        [other.year, other.month],
        a,
        b,
      );
    }
    case "quarterly": {
      const other = B as Extract<ParsedGroupingKey, { type: "quarterly" }>;
      return compareNumbersWithFallback(
        [A.year, A.quarter],
        [other.year, other.quarter],
        a,
        b,
      );
    }
    case "yearly": {
      const other = B as Extract<ParsedGroupingKey, { type: "yearly" }>;
      return compareNumbersWithFallback([A.year], [other.year], a, b);
    }
    case "seasonal": {
      const other = B as Extract<ParsedGroupingKey, { type: "seasonal" }>;
      return compareNumbersWithFallback(
        [A.year, A.order],
        [other.year, other.order],
        a,
        b,
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
