import { API_BASE, USER_AGENT } from "./constants";
import { coerceNumber } from "./utils";

export class PxError extends Error {}

type HttpMethod = "GET" | "POST";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  timeout?: number;
};

type RequestOk = {
  ok: true;
  json: unknown;
};

type RequestFail = {
  ok: false;
  status?: number;
  statusText?: string;
  text?: string;
};

type RequestResult = RequestOk | RequestFail;

export type PxVariable = {
  code: string;
  text?: string | null;
  values?: string[];
  valueTexts?: string[];
  time?: boolean;
  [key: string]: unknown;
};

export type PxMeta = {
  variables?: PxVariable[];
  [key: string]: unknown;
};

type PxCubeColumn = {
  code?: string;
  type?: string;
};

type PxCubeRow = {
  key?: unknown[];
  values?: unknown[];
  value?: unknown;
};

export type PxCube = {
  columns?: PxCubeColumn[];
  data?: PxCubeRow[];
  value?: unknown[];
  id?: string[];
  dimension?: Record<
    string,
    {
      category?: {
        index?: Record<string, number>;
      };
    }
  >;
  metadata?: unknown;
  [key: string]: unknown;
};

type CubeMetadata = {
  updated?: unknown;
  unit?: unknown;
  title?: unknown;
  [key: string]: unknown;
};

type TableLookupResult = {
  dimCodes: string[];
  lookup: Map<string, number | null>;
};

export async function requestJson(
  url: string,
  { method = "GET", body, timeout = 30000 }: RequestOptions = {},
): Promise<RequestResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        statusText: res.statusText,
        text,
      };
    }
    try {
      return { ok: true, json: text ? JSON.parse(text) : {} };
    } catch (err) {
      const parseErrorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : typeof err === "number" ||
                typeof err === "boolean" ||
                typeof err === "bigint"
              ? String(err)
              : typeof err === "symbol"
                ? err.toString()
                : JSON.stringify(err ?? {});
      return {
        ok: false,
        status: res.status,
        statusText: res.statusText,
        text: `invalid json: ${parseErrorMessage}`,
      };
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, statusText: "timeout", text: "Request timed out" };
    }
    return {
      ok: false,
      statusText: err instanceof Error ? err.message : "error",
      text: String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function apiJoin(base: string, parts: readonly string[]): string {
  const segments = [
    base.replace(/\/+$/, ""),
    ...parts.map((part) => encodeURIComponent(part)),
  ];
  return segments.join("/");
}

export async function pxGetMeta(parts: readonly string[]): Promise<PxMeta> {
  const url = apiJoin(API_BASE, parts);
  let lastErr: string | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await requestJson(url, { method: "GET", timeout: 30000 });
    if (result.ok) return result.json as PxMeta;
    lastErr = formatErrorMessage("GET", url, result);
    if (result.status === 429 && attempt < 2) {
      await delay(500 * (attempt + 1));
      continue;
    }
    break;
  }
  throw new PxError(lastErr ?? "Meta fetch failed");
}

export async function pxPostData(
  parts: readonly string[],
  body: Record<string, unknown>,
): Promise<PxCube> {
  const payload = { ...body };
  if (!payload.response) payload.response = { format: "JSON" };
  const url = apiJoin(API_BASE, parts);
  let lastErr: string | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await requestJson(url, {
      method: "POST",
      body: payload,
      timeout: 60000,
    });
    if (result.ok) return result.json as PxCube;
    lastErr = formatErrorMessage("POST", url, result);
    if (result.status === 429 && attempt < 2) {
      await delay(500 * (attempt + 1));
      continue;
    }
    break;
  }
  throw new PxError(lastErr ?? "Data fetch failed");
}

function formatErrorMessage(
  method: HttpMethod,
  url: string,
  result: RequestResult,
): string {
  const statusBits: string[] = [];
  if (
    "status" in result &&
    result.status !== undefined &&
    result.status !== null
  ) {
    statusBits.push(String(result.status));
  }
  const statusText = "statusText" in result ? result.statusText : undefined;
  if (statusText) {
    statusBits.push(statusText);
  }
  const statusPart = statusBits.join(" ").trim();
  const text = "text" in result ? result.text : undefined;
  const textPart = text ? ` ${(text ?? "").slice(0, 200)}` : "";
  return (
    `${method} ${url}` +
    (statusPart ? ` -> ${statusPart}` : "") +
    textPart
  ).trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function metaVariables(meta: PxMeta): PxVariable[] {
  return Array.isArray(meta?.variables) ? [...meta.variables] : [];
}

export function metaFindVar(
  meta: PxMeta,
  predicate: (text: string, code: string, variable: PxVariable) => boolean,
): PxVariable | null {
  for (const variable of metaVariables(meta)) {
    const text = String(variable?.text ?? "");
    const code = String(variable?.code ?? "");
    if (predicate(text, code, variable)) return variable;
  }
  return null;
}

type VarMatcher =
  | string
  | RegExp
  | ((text: string, code: string, variable: PxVariable) => boolean)
  | {
      code?: string;
      codes?: string[];
      text?: string;
      texts?: string[];
      predicate?: (text: string, code: string, variable: PxVariable) => boolean;
      predicates?: Array<
        (text: string, code: string, variable: PxVariable) => boolean
      >;
    };

export function metaFindVarCode(
  meta: PxMeta,
  ...matchers: VarMatcher[]
): string | null {
  const variables = metaVariables(meta);
  if (!variables.length) return null;

  const ordered: VarMatcher[] = [];
  const enqueue = (matcher: VarMatcher | VarMatcher[] | null | undefined) => {
    if (matcher === undefined || matcher === null) return;
    if (Array.isArray(matcher)) {
      for (const inner of matcher) enqueue(inner);
      return;
    }
    if (
      typeof matcher === "object" &&
      typeof matcher !== "function" &&
      !(matcher instanceof RegExp)
    ) {
      const { code, codes, text, texts, predicate, predicates } = matcher;
      enqueue(code ?? null);
      enqueue(codes ?? null);
      enqueue(text ?? null);
      enqueue(texts ?? null);
      enqueue(predicate ?? null);
      enqueue(predicates ?? null);
      return;
    }
    ordered.push(matcher);
  };

  enqueue(matchers);
  if (!ordered.length) return null;

  const normalize = (value: unknown) => {
    if (typeof value === "string") return value.trim().toLowerCase();
    if (typeof value === "number" || typeof value === "bigint")
      return String(value).trim().toLowerCase();
    return "";
  };

  const lookupString = (candidate: VarMatcher) => {
    if (typeof candidate === "string") {
      const target = normalize(candidate);
      if (!target) return null;
      const found = variables.find((variable) => {
        const text = normalize(variable?.text);
        const code = normalize(variable?.code);
        return text === target || code === target;
      });
      return found?.code ?? null;
    }
    if (candidate instanceof RegExp) {
      const found = variables.find((variable) => {
        const text = String(variable?.text ?? "");
        const code = String(variable?.code ?? "");
        return candidate.test(text) || candidate.test(code);
      });
      return found?.code ?? null;
    }
    return null;
  };

  for (const matcher of ordered) {
    if (typeof matcher === "function") {
      const found = metaFindVar(meta, matcher);
      if (found?.code) return found.code;
    } else {
      const result = lookupString(matcher);
      if (result) return result;
    }
  }
  return null;
}

export function metaValueMap(
  meta: PxMeta,
  varCode: string,
): Array<[string, string]> {
  const variable = metaVariables(meta).find((v) => v?.code === varCode);
  if (!variable) return [];
  const values = Array.isArray(variable.values) ? variable.values : [];
  let texts = Array.isArray(variable.valueTexts) ? variable.valueTexts : [];
  if (!texts.length || texts.length !== values.length) {
    texts = values.map((c) => String(c));
  }
  return values.map((value, index) => [
    String(value),
    String(texts[index] ?? value),
  ]);
}

export function requireVariable(
  meta: PxMeta,
  code: string,
  datasetId?: string,
): PxVariable {
  const variable = metaVariables(meta).find((entry) => entry?.code === code);
  if (!variable) {
    const context = datasetId ? `${datasetId}: ` : "";
    throw new PxError(`${context}expected dimension "${code}" in metadata`);
  }
  return variable;
}

export function buildValuePairs(variable: PxVariable): Array<[string, string]> {
  const values = Array.isArray(variable.values) ? variable.values : [];
  let texts = Array.isArray(variable.valueTexts) ? variable.valueTexts : [];
  if (!texts.length || texts.length !== values.length) {
    texts = values.map((value) => String(value));
  }
  return values.map((value, index) => [
    String(value),
    String(texts[index] ?? value),
  ]);
}

export function extractTimeCodes(variable: PxVariable): string[] {
  const values = Array.isArray(variable.values) ? [...variable.values] : [];
  if (variable.time === true) values.reverse();
  return values.map((value) => String(value));
}

export function readCubeMetadata(cube: unknown): {
  updatedAt: string | null;
  unit: string | null;
  title: string | null;
} {
  const metadata =
    typeof cube === "object" && cube !== null && "metadata" in cube
      ? (cube as { metadata?: CubeMetadata }).metadata
      : undefined;
  const updatedRaw = metadata?.updated;
  const unitRaw = metadata?.unit;
  const titleRaw = metadata?.title;
  return {
    updatedAt: typeof updatedRaw === "string" ? updatedRaw : null,
    unit:
      typeof unitRaw === "string"
        ? unitRaw
        : typeof unitRaw === "number"
          ? String(unitRaw)
          : null,
    title: typeof titleRaw === "string" ? titleRaw : null,
  };
}

export function metaTimeCodes(meta: PxMeta, timeCode: string): string[] {
  const variable = metaVariables(meta).find((v) => v?.code === timeCode);
  if (!variable) return [];
  const values = Array.isArray(variable.values) ? [...variable.values] : [];
  if (variable.time === true) values.reverse();
  return values.map((value) => String(value));
}

export function findTimeDimension(
  meta: PxMeta,
  fallback = "Viti/muaji",
): string {
  return (
    metaFindVarCode(
      meta,
      "Viti/muaji",
      "Viti",
      (text, _code, variable) => variable.time === true,
    ) || fallback
  );
}

export function tableLookup(
  cube: PxCube,
  dimOrder: string[] | null = null,
): TableLookupResult | null {
  const dataRows = Array.isArray(cube?.data) ? cube.data : null;
  if (dataRows?.length) {
    let dimCodes: string[] | undefined;
    if (Array.isArray(cube?.columns)) {
      const dimCols = cube.columns.filter((col) => col?.type !== "c");
      dimCodes = dimCols.map((col) => String(col?.code ?? ""));
    } else if (Array.isArray(dimOrder) && dimOrder.length) {
      dimCodes = dimOrder.map((code) => String(code));
    } else {
      return null;
    }
    const lookup = new Map<string, number | null>();
    for (const row of dataRows) {
      const keyVals = Array.isArray(row?.key)
        ? row.key.map((value) => String(value))
        : [];
      if (keyVals.length !== dimCodes.length) continue;
      let value: unknown = null;
      if (Array.isArray(row?.values)) {
        const vals = row.values.length ? row.values : [null];
        value = vals[0] ?? null;
      } else if (row && Object.prototype.hasOwnProperty.call(row, "value")) {
        value = row.value;
      }
      lookup.set(JSON.stringify(keyVals), coerceNumber(value));
    }
    return { dimCodes, lookup };
  }
  return tableLookupFromValueCube(cube, dimOrder);
}

export function tableLookupFromValueCube(
  cube: PxCube,
  dimOrder: string[] | null = null,
): TableLookupResult | null {
  if (!Array.isArray(cube?.value) || !cube?.dimension) return null;
  const dimensionOrder =
    Array.isArray(dimOrder) && dimOrder.length
      ? dimOrder.map((code) => String(code))
      : Array.isArray(cube.id) && cube.id.length
        ? cube.id.map((code) => String(code))
        : null;
  if (!dimensionOrder?.length) return null;
  const dimDetails: Array<{ code: string; ordToValue: string[] }> = [];
  for (const code of dimensionOrder) {
    const dimension = cube.dimension?.[code];
    const indexEntries = Object.entries(dimension?.category?.index ?? {}).map(
      ([valueCode, ordinal]) => [String(valueCode), Number(ordinal)] as const,
    );
    if (!indexEntries.length) return null;
    indexEntries.sort((a, b) => a[1] - b[1]);
    const ordToValue = indexEntries.map(([valueCode]) => valueCode);
    dimDetails.push({ code, ordToValue });
  }
  const sizes = dimDetails.map((detail) => detail.ordToValue.length);
  if (!sizes.every((size) => Number.isInteger(size) && size > 0)) return null;
  const strides: number[] = Array.from({ length: sizes.length }, () => 1);
  for (let i = sizes.length - 2; i >= 0; i -= 1) {
    const nextStride = strides[i + 1] ?? 1;
    const nextSize = sizes[i + 1] ?? 1;
    strides[i] = nextStride * nextSize;
  }
  const lookup = new Map<string, number | null>();
  for (let idx = 0; idx < cube.value.length; idx += 1) {
    const coords = strides.map((stride, dimIdx) => {
      const size = sizes[dimIdx] || 1;
      return stride ? Math.floor(idx / stride) % size : 0;
    });
    const keyVals: string[] = [];
    let invalid = false;
    for (let dimIdx = 0; dimIdx < dimDetails.length; dimIdx += 1) {
      const detail = dimDetails[dimIdx];
      if (!detail) {
        invalid = true;
        break;
      }
      const ord = coords[dimIdx] ?? 0;
      const valueCode = detail.ordToValue[ord];
      if (valueCode === undefined) {
        invalid = true;
        break;
      }
      keyVals.push(String(valueCode));
    }
    if (invalid) continue;
    lookup.set(JSON.stringify(keyVals), coerceNumber(cube.value[idx]));
  }
  return { dimCodes: dimensionOrder, lookup };
}

export function lookupTableValue(
  dimCodes: string[],
  lookup: Map<string, number | null>,
  assignments: Record<string, string>,
): number | null {
  const key = dimCodes.map((dim) => {
    const val = assignments?.[dim];
    return val === undefined || val === null ? null : String(val);
  });
  if (key.some((value) => value === null)) return null;
  return lookup.get(JSON.stringify(key)) ?? null;
}
