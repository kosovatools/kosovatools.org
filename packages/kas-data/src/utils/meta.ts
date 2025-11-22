import type { GenericDatasetMeta } from "../types/dataset";
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
      hourCycle: "h23", // Avoid locale-dependent day periods that can misalign server/client output
    },
    { fallback, preserveInputOnInvalid: false },
  );
}

export function latestUpdatedAt(
  metas: Array<GenericDatasetMeta | undefined>,
): string | null {
  let latest: string | null = null;
  for (const meta of metas) {
    const updatedAt = meta?.updated_at;
    if (!updatedAt) continue;
    if (!latest || updatedAt > latest) latest = updatedAt;
  }
  return latest;
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
  if (!options?.length) return {} as Readonly<Record<TKey, string>>;
  const filtered = options.filter((option): option is KeyLabelOption<TKey> =>
    Boolean(option?.key && typeof option.key === "string"),
  );
  const entries = filtered.map((option) => [option.key, getSafeLabel(option)]);
  return Object.fromEntries(entries) as Readonly<Record<TKey, string>>;
}
