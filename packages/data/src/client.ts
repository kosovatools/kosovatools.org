export const DATASET_BASE_URL = "https://data.kosovatools.org";

export type DatasetPath = string | readonly string[];

export type DatasetApiOptions = {
  prefix?: DatasetPath;
  fetch?: typeof fetch;
  defaultInit?: RequestInit;
};

export type DatasetApi = {
  readonly baseUrl: string;
  readonly prefix?: string;
  url(path?: DatasetPath): string;
  fetchJson<T>(path: DatasetPath, init?: RequestInit): Promise<T>;
};

const DEFAULT_REQUEST_INIT: RequestInit = {
  cache: "force-cache",
  headers: {
    Accept: "application/json",
  },
};

function normalizeSegment(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function toPathString(path?: DatasetPath): string {
  if (!path) {
    return "";
  }
  if (Array.isArray(path)) {
    return path
      .map((segment) => normalizeSegment(String(segment)))
      .filter(Boolean)
      .join("/");
  }
  return normalizeSegment(String(path));
}

function resolveHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return { ...headers };
}

function mergeRequestInit(
  baseInit: RequestInit | undefined,
  overrideInit: RequestInit | undefined,
): RequestInit {
  const defaultHeaders = resolveHeaders(DEFAULT_REQUEST_INIT.headers);
  const baseHeaders = resolveHeaders(baseInit?.headers);
  const overrideHeaders = resolveHeaders(overrideInit?.headers);

  const headers = {
    ...defaultHeaders,
    ...baseHeaders,
    ...overrideHeaders,
  };

  const cache =
    overrideInit?.cache ?? baseInit?.cache ?? DEFAULT_REQUEST_INIT.cache;
  const credentials =
    overrideInit?.credentials ?? baseInit?.credentials ?? undefined;

  const merged: RequestInit = {
    ...DEFAULT_REQUEST_INIT,
    ...baseInit,
    ...overrideInit,
    cache,
  };

  merged.headers = headers;

  if (credentials) {
    merged.credentials = credentials;
  }

  return merged;
}

export function createDatasetApi(options: DatasetApiOptions = {}): DatasetApi {
  const fetchFn = options.fetch ?? globalThis.fetch;
  if (typeof fetchFn !== "function") {
    throw new Error("Global fetch API is not available in this environment.");
  }

  const prefixPath = toPathString(options.prefix);
  const root =
    prefixPath.length > 0
      ? new URL(`${prefixPath}/`, ensureTrailingSlash(DATASET_BASE_URL))
          .toString()
          .replace(/\/$/, "")
      : DATASET_BASE_URL;

  const defaultInit = mergeRequestInit(
    DEFAULT_REQUEST_INIT,
    options.defaultInit,
  );

  function url(path?: DatasetPath): string {
    const relative = toPathString(path);
    if (!relative) {
      return root;
    }

    const rootWithSlash = ensureTrailingSlash(root);
    return new URL(relative, rootWithSlash).toString();
  }

  async function fetchJson<T>(
    path: DatasetPath,
    init?: RequestInit,
  ): Promise<T> {
    const targetUrl = url(path);
    const requestInit = mergeRequestInit(defaultInit, init);
    const response = await fetchFn(targetUrl, requestInit);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch dataset (${response.status} ${response.statusText}) for ${targetUrl}`,
      );
    }

    return (await response.json()) as T;
  }

  return {
    baseUrl: root,
    prefix: prefixPath.length > 0 ? prefixPath : undefined,
    url,
    fetchJson,
  };
}

export type DatasetFetcher = <T>(
  path: DatasetPath,
  init?: RequestInit,
) => Promise<T>;

export type DatasetFetcherOptions = Omit<DatasetApiOptions, "prefix"> & {
  label?: string;
};

export function createDatasetFetcher(
  prefix: DatasetPath,
  options: DatasetFetcherOptions = {},
): DatasetFetcher {
  const { label, ...apiOptions } = options;
  const api = createDatasetApi({ ...apiOptions, prefix });
  const labelText =
    label ??
    (Array.isArray(prefix)
      ? prefix.map((segment) => String(segment)).join("/")
      : toPathString(prefix));

  return async function datasetFetcher<T>(
    path: DatasetPath,
    init?: RequestInit,
  ): Promise<T> {
    try {
      return await api.fetchJson<T>(path, init);
    } catch (error) {
      if (error instanceof Error) {
        error.message = `[dataset:${labelText}] ${error.message}`;
      }
      throw error;
    }
  };
}
