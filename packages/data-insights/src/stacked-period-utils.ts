import type { StackPeriodGrouping } from "@workspace/stats";

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "2-digit",
});

const yearFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
});

const QUARTER_PATTERN = /^(\d{4})-Q([1-4])$/;

function parseYearMonth(period: string): Date | null {
  const [yearStr, monthStr] = period.split("-");
  if (!yearStr || !monthStr) {
    return null;
  }

  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, 1));
}

export const STACKED_PERIOD_GROUPING_OPTIONS: Array<{
  id: StackPeriodGrouping;
  label: string;
}> = [
    { id: "monthly", label: "Monthly" },
    { id: "quarterly", label: "Quarterly" },
    { id: "yearly", label: "Yearly" },
    { id: "seasonal", label: "Seasonal" },
  ];

export function formatStackedPeriodLabel(
  period: string,
  grouping: StackPeriodGrouping,
): string {
  if (grouping === "seasonal") {
    return formatSeasonalPeriodLabel(period);
  }

  if (grouping === "monthly") {
    const parsed = parseYearMonth(period);
    return parsed ? monthFormatter.format(parsed) : period;
  }

  if (grouping === "quarterly") {
    const match = QUARTER_PATTERN.exec(period);
    if (match) {
      const [, year, quarter] = match;
      return `Q${quarter} ${year}`;
    }
    return period;
  }

  if (grouping === "yearly") {
    const parsed = Number.parseInt(period, 10);
    if (Number.isFinite(parsed)) {
      return yearFormatter.format(new Date(Date.UTC(parsed, 0, 1)));
    }
    return period;
  }

  return period;
}

export function getStackedPeriodFormatter(
  grouping: StackPeriodGrouping,
): (period: string) => string {
  return (period: string) => formatStackedPeriodLabel(period, grouping);
}

function formatSeasonalPeriodLabel(period: string): string {
  const match = /^(\d{4})-(winter|spring|summer|autumn)$/.exec(period);
  if (!match) {
    return period;
  }

  const [, year, season] = match;
  if (!season) {
    return period;
  }

  const capitalized = season.charAt(0).toUpperCase() + season.slice(1);
  return `${capitalized} ${year}`;
}
