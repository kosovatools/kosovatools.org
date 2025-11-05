import { API_BASE, USER_AGENT } from "./constants.mjs";
import { coerceNumber } from "./utils.mjs";

export class PxError extends Error { }

export async function requestJson(
  url,
  { method = "GET", body, timeout = 30000 } = {},
) {
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
      return {
        ok: false,
        status: res.status,
        statusText: res.statusText,
        text: `invalid json: ${err}`,
      };
    }
  } catch (err) {
    if (err?.name === "AbortError") {
      return { ok: false, statusText: "timeout", text: "Request timed out" };
    }
    return {
      ok: false,
      statusText: err?.message ?? "error",
      text: String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function apiJoin(base, parts) {
  const segs = [
    base.replace(/\/+$/, ""),
    ...parts.map((p) => encodeURIComponent(p)),
  ];
  return segs.join("/");
}

export async function pxGetMeta(parts) {
  const url = apiJoin(API_BASE, parts);
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await requestJson(url, { method: "GET", timeout: 30000 });
    if (result.ok) return result.json;
    lastErr = formatErrorMessage("GET", url, result);
    if (result.status === 429 && attempt < 2) {
      await delay(500 * (attempt + 1));
      continue;
    }
    break;
  }
  throw new PxError(lastErr ?? "Meta fetch failed");
}

export async function pxPostData(parts, body) {
  const payload = { ...body };
  if (!payload.response) payload.response = { format: "JSON" };
  const url = apiJoin(API_BASE, parts);
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await requestJson(url, {
      method: "POST",
      body: payload,
      timeout: 60000,
    });
    if (result.ok) return result.json;
    lastErr = formatErrorMessage("POST", url, result);
    if (result.status === 429 && attempt < 2) {
      await delay(500 * (attempt + 1));
      continue;
    }
    break;
  }
  throw new PxError(lastErr ?? "Data fetch failed");
}

function formatErrorMessage(method, url, result) {
  const statusBits = [];
  if (result.status !== undefined && result.status !== null) {
    statusBits.push(result.status);
  }
  if (result.statusText) {
    statusBits.push(result.statusText);
  }
  const statusPart = statusBits.join(" ").trim();
  const textPart = result.text ? ` ${(result.text ?? "").slice(0, 200)}` : "";
  return (
    `${method} ${url}` +
    (statusPart ? ` -> ${statusPart}` : "") +
    textPart
  ).trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function metaVariables(meta) {
  return Array.isArray(meta?.variables) ? [...meta.variables] : [];
}

export function metaFindVar(meta, predicate) {
  for (const v of metaVariables(meta)) {
    const text = String(v?.text ?? "");
    const code = String(v?.code ?? "");
    if (predicate(text, code, v)) return v;
  }
  return null;
}

export function metaFindVarCode(meta, ...matchers) {
  const variables = metaVariables(meta);
  if (!variables.length) return null;

  const ordered = [];
  const enqueue = (matcher) => {
    if (matcher === undefined || matcher === null) return;
    if (Array.isArray(matcher)) {
      for (const inner of matcher) enqueue(inner);
      return;
    }
    if (typeof matcher === "object" && typeof matcher !== "function") {
      const { code, codes, text, texts, predicate, predicates } = matcher;
      enqueue(code);
      enqueue(codes);
      enqueue(text);
      enqueue(texts);
      enqueue(predicate);
      enqueue(predicates);
      return;
    }
    ordered.push(matcher);
  };

  enqueue(matchers);
  if (!ordered.length) return null;

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();
  const lookupString = (candidate) => {
    const target = normalize(candidate);
    if (!target) return null;
    const found = variables.find((variable) => {
      const text = normalize(variable?.text);
      const code = normalize(variable?.code);
      return text === target || code === target;
    });
    return found?.code ?? null;
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

export function metaValueMap(meta, varCode) {
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

export function metaTimeCodes(meta, timeCode) {
  const variable = metaVariables(meta).find((v) => v?.code === timeCode);
  if (!variable) return [];
  const values = Array.isArray(variable.values) ? [...variable.values] : [];
  if (variable.time === true) values.reverse();
  return values.map((v) => String(v));
}

export function findTimeDimension(meta, fallback = "Viti/muaji") {
  return (
    metaFindVarCode(
      meta,
      "Viti/muaji",
      "Viti",
      (text, _code, variable) => variable.time === true,
    ) || fallback
  );
}

export function tableLookup(cube, dimOrder = null) {
  const dataRows = Array.isArray(cube?.data) ? cube.data : null;
  if (dataRows?.length) {
    let dimCodes;
    if (Array.isArray(cube?.columns)) {
      const dimCols = cube.columns.filter((col) => col?.type !== "c");
      dimCodes = dimCols.map((col) => String(col?.code ?? ""));
    } else if (Array.isArray(dimOrder) && dimOrder.length) {
      dimCodes = dimOrder.map((c) => String(c));
    } else {
      return null;
    }
    const lookup = new Map();
    for (const row of dataRows) {
      const keyVals = Array.isArray(row?.key)
        ? row.key.map((v) => String(v))
        : [];
      if (keyVals.length !== dimCodes.length) continue;
      let value = null;
      if (Array.isArray(row?.values)) {
        const vals = row.values.length ? row.values : [null];
        value = vals[0];
      } else if (Object.prototype.hasOwnProperty.call(row ?? {}, "value")) {
        value = row.value;
      }
      lookup.set(JSON.stringify(keyVals), coerceNumber(value));
    }
    return { dimCodes, lookup };
  }
  return tableLookupFromValueCube(cube, dimOrder);
}

export function tableLookupFromValueCube(cube, dimOrder = null) {
  if (!Array.isArray(cube?.value) || !cube?.dimension) return null;
  const dimensionOrder =
    Array.isArray(dimOrder) && dimOrder.length
      ? dimOrder.map((code) => String(code))
      : Array.isArray(cube.id) && cube.id.length
        ? cube.id.map((code) => String(code))
        : null;
  if (!dimensionOrder?.length) return null;
  const dimDetails = dimensionOrder.map((code) => {
    const dimension = cube.dimension?.[code];
    const indexEntries = Object.entries(dimension?.category?.index ?? {}).map(
      ([valueCode, ordinal]) => [String(valueCode), Number(ordinal)],
    );
    if (!indexEntries.length) return null;
    indexEntries.sort((a, b) => a[1] - b[1]);
    const ordToValue = indexEntries.map(([valueCode]) => valueCode);
    return { code, ordToValue };
  });
  if (dimDetails.some((detail) => !detail)) return null;
  const sizes = dimDetails.map((detail) => detail.ordToValue.length);
  if (!sizes.every((size) => Number.isInteger(size) && size > 0)) return null;
  const strides = Array(sizes.length).fill(1);
  for (let i = sizes.length - 2; i >= 0; i -= 1) {
    strides[i] = strides[i + 1] * sizes[i + 1];
  }
  const lookup = new Map();
  for (let idx = 0; idx < cube.value.length; idx += 1) {
    const coords = strides.map((stride, dimIdx) => {
      const size = sizes[dimIdx] || 1;
      return stride ? Math.floor(idx / stride) % size : 0;
    });
    const keyVals = coords.map((ord, dimIdx) => {
      const valueCode = dimDetails[dimIdx].ordToValue[ord];
      return valueCode === undefined ? null : String(valueCode);
    });
    if (keyVals.some((value) => value === null)) continue;
    lookup.set(JSON.stringify(keyVals), coerceNumber(cube.value[idx]));
  }
  return { dimCodes: dimensionOrder, lookup };
}

export function lookupTableValue(dimCodes, lookup, assignments) {
  const key = dimCodes.map((dim) => {
    const val = assignments?.[dim];
    return val === undefined || val === null ? null : String(val);
  });
  if (key.some((v) => v === null)) return null;
  return lookup.get(JSON.stringify(key)) ?? null;
}
