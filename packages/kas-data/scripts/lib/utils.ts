export type MetaField = {
  key: string;
  label: string;
  unit?: string | null;
};

export type CreateMetaOptions = {
  updatedAt?: string | null;
  unit?: string | null;
  fields?: MetaField[];
} & Record<string, unknown>;

export function createMeta(
  parts: readonly string[],
  generatedAt: string,
  options: CreateMetaOptions = {},
) {
  const { updatedAt = null, unit = null, fields = [], ...rest } = options;
  return {
    table: parts[parts.length - 1],
    path: parts.join("/"),
    generated_at: generatedAt,
    updated_at: updatedAt,
    unit,
    fields,
    ...rest,
  } as const;
}

export function jsonStringify(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => value ?? null, 2);
}

export function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number(value);
  const str = String(value).trim();
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
  ) {
    return "ready_for_market";
  }
  if (normalized.includes("production") || normalized.includes("prodhim")) {
    return "production";
  }
  if (normalized.includes("import") || normalized.includes("importi")) {
    return "import";
  }
  if (normalized.includes("export") || normalized.includes("eksport")) {
    return "export";
  }
  if (normalized.includes("stock") || normalized.includes("stok")) {
    return "stock";
  }
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
  if (upperAlpha && UPPERCASE_WORDS.has(upperAlpha)) {
    return trimmed.replace(alpha, upperAlpha);
  }
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
      if (/[^A-Za-z]/.test(token) && token.length === 1) {
        return token;
      }
      return smartTitleCase(token);
    })
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
  return recombined.replace(
    /\b(And|Or|The|Of|With|For|On|In|By|To|At)\b/g,
    (match) => match.toLowerCase(),
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
  if (uppercaseRatio >= 0.6) {
    return beautifyChapterText(normalized);
  }
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
    return {
      code: "",
      label: "",
      description: "",
      title: "",
      raw: "",
    };
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
    if (numberMatch) {
      code = numberMatch[0]?.padStart(2, "0") ?? "";
    }
  }
  const splitParts = remainder.split(/\s*[-–—:]\s*/).map((part) => part.trim());
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
    if (Number.isFinite(numericCode)) {
      title = `Kapitulli ${numericCode}`;
    }
  }
  if (!title) title = description || raw;
  if (!description) description = title;
  const label = code ? `${code} · ${description}` : description;
  return {
    code,
    label,
    description,
    title,
    raw,
  };
}

export function normalizeYM(code: string): string {
  if (/^\d{6}$/.test(code)) {
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }
  if (code.includes("M")) {
    const [year = "", month = ""] = code.split("M", 2);
    if (!month) return year;
    return `${year}-${month.padStart(2, "0")}`;
  }
  if (code.length === 7 && code[4] === "-") return code;
  return code;
}
