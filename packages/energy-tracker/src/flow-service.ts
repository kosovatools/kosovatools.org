export function getMonthlyPeriodRange(period: string): {
  start: string;
  end: string;
} {
  const [yearPart, monthPart] = period.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error(`Invalid period format: ${period}`);
  }
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}
