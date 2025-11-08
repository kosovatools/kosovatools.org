const DEFAULT_MULTI_VALUE_SEPARATOR = ",";

export type SearchParamsLike =
  | string
  | URLSearchParams
  | { toString(): string }
  | null
  | undefined;

export type SearchParamPrimitive = string | number | boolean;
export type SearchParamEntry =
  | SearchParamPrimitive
  | Array<SearchParamPrimitive>
  | null
  | undefined;

export type SearchParamUpdates = Record<string, SearchParamEntry>;

export type SearchParamsReadable = Pick<URLSearchParams, "get">;

export type MergeSearchParamsOptions = {
  removeEmpty?: boolean;
  multiValueSeparator?: string;
};

export type GetSearchParamStringOptions = {
  trim?: boolean;
  preserveEmpty?: boolean;
  fallback?: string | null;
};

export type GetSearchParamNumberOptions = {
  integer?: boolean;
  fallback?: number | null;
  min?: number;
  max?: number;
};

function ensureURLSearchParams(init?: SearchParamsLike): URLSearchParams {
  if (!init) {
    return new URLSearchParams();
  }

  if (init instanceof URLSearchParams) {
    return new URLSearchParams(init);
  }

  if (typeof init === "string") {
    return new URLSearchParams(init);
  }

  return new URLSearchParams(init.toString());
}

function toNormalizedString(
  value: SearchParamPrimitive | null | undefined,
  removeEmpty: boolean,
): string | null {
  if (value == null) {
    return null;
  }

  const raw = typeof value === "string" ? value : String(value);
  const normalized = removeEmpty ? raw.trim() : raw;

  if (removeEmpty && normalized.length === 0) {
    return null;
  }

  return normalized;
}

function serializeEntry(
  entry: SearchParamEntry,
  removeEmpty: boolean,
  separator: string,
): string | null {
  if (Array.isArray(entry)) {
    const serialized = entry
      .map((value) => toNormalizedString(value, removeEmpty))
      .filter((value): value is string => Boolean(value));

    return serialized.length ? serialized.join(separator) : null;
  }

  return toNormalizedString(entry, removeEmpty);
}

export function mergeSearchParams(
  init: SearchParamsLike,
  updates: SearchParamUpdates,
  options: MergeSearchParamsOptions = {},
): URLSearchParams {
  const params = ensureURLSearchParams(init);
  const separator =
    options.multiValueSeparator ?? DEFAULT_MULTI_VALUE_SEPARATOR;
  const removeEmpty = options.removeEmpty ?? true;

  for (const [key, value] of Object.entries(updates)) {
    const serialized = serializeEntry(value, removeEmpty, separator);

    if (serialized == null) {
      params.delete(key);
      continue;
    }

    params.set(key, serialized);
  }

  return params;
}

export function buildSearchString(
  init: SearchParamsLike,
  updates: SearchParamUpdates,
  options?: MergeSearchParamsOptions,
): string {
  const next = mergeSearchParams(init, updates, options);
  return next.toString();
}

export function getSearchParamString(
  params: SearchParamsReadable,
  key: string,
  options: GetSearchParamStringOptions = {},
): string | null {
  const raw = params.get(key);

  if (raw == null) {
    return options.fallback ?? null;
  }

  const value = options.trim === false ? raw : raw.trim();

  if (!options.preserveEmpty && value.length === 0) {
    return options.fallback ?? null;
  }

  return value;
}

export function getSearchParamNumber(
  params: SearchParamsReadable,
  key: string,
  options: GetSearchParamNumberOptions = {},
): number | null {
  const raw = params.get(key);

  if (raw == null) {
    return options.fallback ?? null;
  }

  const parsed =
    options.integer === false ? Number(raw) : Number.parseInt(raw, 10);

  if (Number.isNaN(parsed)) {
    return options.fallback ?? null;
  }

  let value = parsed;

  if (typeof options.min === "number" && value < options.min) {
    value = options.min;
  }

  if (typeof options.max === "number" && value > options.max) {
    value = options.max;
  }

  return value;
}
