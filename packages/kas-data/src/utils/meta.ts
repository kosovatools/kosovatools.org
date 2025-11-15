import type { DatasetMeta } from "../types/dataset";
import { formatDate } from "@workspace/utils";

type KeyLabelOption<TKey extends string = string> = Readonly<{
  key: TKey;
  label?: string | null;
}>;

export type LabelMap<TKey extends string = string> = ReadonlyMap<TKey, string>;

export function formatGeneratedAt(
  generatedAt?: string | null,
  locale = "sq-AL",
  fallback = "E panjohur",
): string {
  return formatDate(
    generatedAt ?? null,
    {
      locale,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    { fallback, preserveInputOnInvalid: false },
  );
}

export function describeDatasetSource(
  meta?: DatasetMeta | null,
  fallback = "E panjohur",
): string {
  return meta?.source && typeof meta.source === "string"
    ? meta.source
    : fallback;
}

export function latestUpdatedAt(
  metas: Array<DatasetMeta | undefined>,
): string | null {
  const timestamps = metas
    .map((m) => m?.updated_at ?? null)
    .filter((v): v is string => Boolean(v));
  if (!timestamps.length) return null;
  return timestamps.sort().at(-1) ?? null;
}

function getSafeLabel<TKey extends string>(
  option: KeyLabelOption<TKey>,
): string {
  const { key, label } = option;
  if (typeof label === "string" && label.trim().length > 0) return label;
  return key;
}

export function createLabelMap<TKey extends string>(
  options?: ReadonlyArray<KeyLabelOption<TKey> | null | undefined>,
): Readonly<Record<TKey, string>> {
  if (!options) return {} as Readonly<Record<TKey, string>>;
  const map: Record<string, string> = {};
  for (const option of options) {
    if (!option) continue;
    const key = option.key;
    if (!key) continue;
    map[key] = getSafeLabel(option);
  }
  return map as Readonly<Record<TKey, string>>;
}
