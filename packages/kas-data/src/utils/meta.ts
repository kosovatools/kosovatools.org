import type { FuelKey, FuelMeta } from "../datasets/fuels";
import type { DatasetMeta } from "../types/dataset";

export function formatGeneratedAt(
  generatedAt?: string | null,
  locale = "sq",
  fallback = "E panjohur",
): string {
  if (!generatedAt) {
    return fallback;
  }
  const parsed = new Date(generatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function describeFuelSources(
  fuelMeta: Record<FuelKey, FuelMeta | undefined>,
  fallback = "E panjohur",
): string {
  const entries = Object.values(fuelMeta)
    .filter((meta): meta is FuelMeta => Boolean(meta))
    .map((meta) => {
      if (meta.label && meta.table) {
        return `${meta.label}: ${meta.table}`;
      }
      return meta.table ?? meta.label ?? null;
    })
    .filter((value): value is string => Boolean(value));
  return entries.length ? entries.join("; ") : fallback;
}

export function latestUpdatedAt(
  metas: Array<DatasetMeta | undefined>,
): string | null {
  const timestamps = metas
    .map((meta) => meta?.updated_at ?? null)
    .filter((value): value is string => Boolean(value));
  if (!timestamps.length) return null;
  return timestamps.sort().at(-1) ?? null;
}
