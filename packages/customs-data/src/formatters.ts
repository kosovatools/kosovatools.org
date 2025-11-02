export function formatPercent(val: number | null | undefined): string {
  if (!Number.isFinite(val)) return "—";
  return `${val}%`;
}

export function formatDate(value: unknown): string {
  try {
    const dt = new Date(value as string);
    return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
  } catch {
    return "—";
  }
}

export function formatMoney(value: unknown): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  try {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(value);
  }
}
