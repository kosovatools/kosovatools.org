export type KeyLabelOption<TKey extends string = string> = Readonly<{
  key: TKey;
  label?: string | null;
}>;

function resolveLabel<TKey extends string>(
  option: KeyLabelOption<TKey>,
): string {
  const { key, label } = option;
  if (typeof label === "string") {
    const trimmed = label.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return key;
}

export function buildKeyLabelMap<TKey extends string>(
  options?: ReadonlyArray<KeyLabelOption<TKey> | null | undefined>,
): Readonly<Record<TKey, string>> {
  if (!options?.length) {
    return {} as Readonly<Record<TKey, string>>;
  }

  const map: Record<string, string> = {};
  for (const entry of options) {
    if (!entry) continue;
    const { key } = entry;
    if (!key) continue;
    map[key] = resolveLabel(entry);
  }

  return map as Readonly<Record<TKey, string>>;
}

export const DEFAULT_OTHER_LABEL = "Të tjerët";
