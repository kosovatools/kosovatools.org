
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
