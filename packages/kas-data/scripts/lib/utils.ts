export type MetaField = {
  key: string;
  label: string;
  unit: string; // REQUIRED per v1.1
};

export type DimensionOption = {
  key: string;
  label: string;
};

export type TimeGranularity =
  | "yearly"
  | "quarterly"
  | "monthly"
  | "weekly"
  | "daily";

export type Meta = {
  id: string;
  generated_at: string;
  updated_at: string | null;
  time: {
    key: "period";
    granularity: TimeGranularity;
    first: string;
    last: string;
    count: number;
  };
  fields: MetaField[];
  metrics: string[];
  dimensions: Record<string, DimensionOption[]>; // excludes period
  unit?: string | null;
  source: string;
  source_urls: string[];
  title?: string | null;
  notes?: string[];
};

export function createMeta(
  id: string,
  generatedAt: string,
  options: Omit<Meta, "id" | "generated_at">,
): Meta {
  const {
    updated_at,
    time,
    fields,
    metrics,
    dimensions,
    unit,
    source,
    source_urls,
    title,
    notes,
  } = options as unknown as Meta;

  // Minimal runtime validation to enforce v1.1
  if (!time || time.key !== "period")
    throw new Error("meta.time.key must be 'period'");
  if (!time.first || !time.last)
    throw new Error("meta.time.first/last required");
  if (!time.granularity) throw new Error("meta.time.granularity required");
  if (!Array.isArray(fields) || !fields.length)
    throw new Error("meta.fields required");
  for (const f of fields)
    if (f.unit === undefined || f.unit === null)
      throw new Error("field.unit must be provided");
  if (!Array.isArray(metrics) || metrics.length !== fields.length)
    throw new Error("meta.metrics must mirror fields");

  return {
    id,
    generated_at: generatedAt,
    updated_at,
    time,
    fields,
    metrics,
    dimensions: dimensions ?? {},
    unit,
    source,
    source_urls,
    title: title ?? null,
    notes: notes ?? [],
  };
}

function normalizeTableLabel(filename: string): string {
  const base = filename.replace(/\.px$/i, "");
  const tabMatch = base.match(/^tab\s*(\d+)/i);
  if (tabMatch && tabMatch[1]) return `Table ${tabMatch[1].padStart(2, "0")}`;
  const numericPrefix = base.match(/^(\d{1,3})[_-]?/);
  if (numericPrefix && numericPrefix[1])
    return `Table ${numericPrefix[1].padStart(2, "0")}`;
  return `Table ${base}`;
}

function pathToUrl(parts: readonly string[]): string {
  return parts.join("/");
}

function resolveCategory(parts: readonly string[]): string {
  return parts[1] ?? parts[0] ?? "ASKdata";
}

function buildCompositeDescription(
  categories: string[],
  tableLabels: string[],
): string {
  if (tableLabels.length === 1)
    return `${tableLabels[0]} in ${categories[0] ?? "ASKdata"}`;
  const uniqueCategories = Array.from(new Set(categories));
  if (uniqueCategories.length === 1)
    return `Data derived from ${tableLabels.join(", ")} in ${uniqueCategories[0]}`;
  return `Data derived from ${tableLabels.join(", ")} across ${uniqueCategories.join(", ")}`;
}

export function describePxSources(
  sourcePaths: readonly (readonly string[])[],
): { description: string; urls: string[] } {
  if (!sourcePaths.length) return { description: "Unknown source", urls: [] };
  const tableLabels: string[] = [];
  const categories: string[] = [];
  const urls: string[] = [];
  for (const parts of sourcePaths) {
    if (!parts || !parts.length) continue;
    const normalizedParts = parts;
    const last = normalizedParts[normalizedParts.length - 1];
    if (!last) continue;
    tableLabels.push(normalizeTableLabel(last));
    categories.push(resolveCategory(normalizedParts));
    urls.push(pathToUrl(normalizedParts));
  }
  const description = buildCompositeDescription(categories, tableLabels);
  return { description, urls };
}

export function jsonStringify(obj: unknown): string {
  return JSON.stringify(obj, (_key, value: unknown) => value ?? null, 2);
}

export function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number(value);
  if (typeof value === "bigint") return Number(value);
  if (typeof value !== "string") return null;
  const str = value.trim();
  if (!str || [".", "..", "...", "-"].includes(str)) return null;
  const cleaned = str.replace(/\u00a0/g, "").replace(/,/g, "");
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

export function tidyNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (Number.isInteger(Number(value))) return Number(value);
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export function slugifyLabel(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^0-9a-z]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "value";
}

export function normalizeFuelField(label: string): string {
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (
    (normalized.includes("ready") && normalized.includes("market")) ||
    (normalized.includes("gatshme") && normalized.includes("treg"))
  )
    return "ready_for_market";
  if (normalized.includes("production") || normalized.includes("prodhim"))
    return "production";
  if (normalized.includes("import") || normalized.includes("importi"))
    return "import";
  if (normalized.includes("export") || normalized.includes("eksport"))
    return "export";
  if (normalized.includes("stock") || normalized.includes("stok"))
    return "stock";
  return slugifyLabel(label);
}

export function normalizeTourismMetric(label: string): "nights" | "visitors" {
  const l = label.toLowerCase();
  return l.includes("night") ? "nights" : "visitors";
}

export function normalizeGroupLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.startsWith("gjith")) return "total";
  if (l.startsWith("ven")) return "local";
  if (l.includes("jasht")) return "external";
  return slugifyLabel(label);
}

export function normalizeWhitespace(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

const UPPERCASE_WORDS = new Set(["FOB", "CIF", "EU", "USA", "UK", "VAT"]);

export function smartTitleCase(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return "";
  const alpha = trimmed.replace(/[^A-Za-z]/g, "");
  const upperAlpha = alpha.toUpperCase();
  if (upperAlpha && UPPERCASE_WORDS.has(upperAlpha))
    return trimmed.replace(alpha, upperAlpha);
  const firstChar = trimmed.charAt(0);
  if (!firstChar) return "";
  return firstChar.toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function beautifyChapterText(text: string): string {
  const normalized = normalizeWhitespace(text);
  const recombined = normalized
    .split(/(\s+|[,;/()-])/g)
    .map((token) => {
      if (!token.trim()) return token;
      if (/[^A-Za-z]/.test(token) && token.length === 1) return token;
      return smartTitleCase(token);
    })
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
  return recombined.replace(
    /\b(And|Or|The|Of|With|For|On|In|By|To|At)\b/g,
    (m) => m.toLowerCase(),
  );
}

export function maybeBeautifyChapterText(text: string): string {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return normalized;
  const letters = normalized.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  if (!letters) return normalized;
  const uppercaseMatches = normalized.match(/[A-ZÀ-ÖØ-Þ]/g);
  const uppercaseRatio =
    uppercaseMatches && letters.length
      ? uppercaseMatches.length / letters.length
      : 0;
  if (uppercaseRatio >= 0.6) return beautifyChapterText(normalized);
  return normalized;
}

export type TradeChapterLabel = {
  code: string;
  label: string;
  description: string;
  title: string;
  raw: string;
};

export function parseTradeChapterLabel(text: string): TradeChapterLabel {
  const raw = normalizeWhitespace(text);
  if (!raw) {
    return { code: "", label: "", description: "", title: "", raw: "" };
  }
  let remainder = raw;
  let code = "";
  const leadingMatch = remainder.match(/^(\d{1,2})\s*([:.-])?\s*/);
  if (leadingMatch) {
    code = leadingMatch[1]?.padStart(2, "0") ?? "";
    remainder = remainder.slice(leadingMatch[0].length).trim();
  }
  if (!code) {
    const numberMatch =
      remainder.match(/\b\d{1,2}\b/) ?? raw.match(/\b\d{1,2}\b/);
    if (numberMatch) code = numberMatch[0]?.padStart(2, "0") ?? "";
  }
  const splitParts = remainder.split(/\s*[-–—:]\s*/).map((p) => p.trim());
  let title = "";
  let description = "";
  if (splitParts.length > 1) {
    const first = splitParts.shift() ?? "";
    title = maybeBeautifyChapterText(first);
    description = maybeBeautifyChapterText(splitParts.join(" - "));
  } else {
    description = maybeBeautifyChapterText(remainder || raw);
  }
  if (!title && code) {
    const numericCode = Number.parseInt(code, 10);
    if (Number.isFinite(numericCode)) title = `Kapitulli ${numericCode}`;
  }
  if (!title) title = description || raw;
  if (!description) description = title;
  const label = code ? `${code} · ${description}` : description;
  return { code, label, description, title, raw };
}

export function normalizeYM(code: string): string {
  if (/^\d{6}$/.test(code)) return `${code.slice(0, 4)}-${code.slice(4)}`;
  if (code.includes("M")) {
    const [year = "", month = ""] = code.split("M", 2);
    if (!month) return year;
    return `${year}-${month.padStart(2, "0")}`;
  }
  if (code.length === 7 && code[4] === "-") return code;
  return code;
}
