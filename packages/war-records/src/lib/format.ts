const numberFormatter = new Intl.NumberFormat("sq-AL", {
  maximumFractionDigits: 0,
});

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return numberFormatter.format(value);
}

export function formatLabel(value: string): string {
  return value
    .split(" ")
    .map((chunk) =>
      chunk.length > 0
        ? chunk[0]?.toLocaleUpperCase("sq-AL") + chunk.slice(1)
        : chunk,
    )
    .join(" ");
}
