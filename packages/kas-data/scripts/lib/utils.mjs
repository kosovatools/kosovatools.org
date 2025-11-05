export function createMeta(parts, generatedAt, options = {}) {
  const { updatedAt = null, unit = null, fields = [], ...rest } = options;
  return {
    table: parts[parts.length - 1],
    path: parts.join("/"),
    generated_at: generatedAt,
    updated_at: updatedAt,
    unit,
    fields,
    ...rest,
  };
}

export function jsonStringify(obj) {
  return JSON.stringify(obj, (_key, value) => value ?? null, 2);
}

export function coerceNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number(value);
  const str = String(value).trim();
  if (!str || [".", "..", "...", "-"].includes(str)) return null;
  const cleaned = str.replace(/\u00a0/g, "").replace(/,/g, "");
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

export function tidyNumber(value) {
  if (value === null || value === undefined) return null;
  if (Number.isInteger(Number(value))) return Number(value);
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export function slugifyLabel(text) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^0-9a-z]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "value";
}

export function normalizeFuelField(label) {
  const l = label.toLowerCase();
  if (l.includes("ready") && l.includes("market")) return "ready_for_market";
  if (l.includes("production")) return "production";
  if (l.includes("import")) return "import";
  if (l.includes("export")) return "export";
  if (l.includes("stock")) return "stock";
  return slugifyLabel(label);
}

export function normalizeTourismMetric(label) {
  const l = label.toLowerCase();
  return l.includes("night") ? "nights" : "visitors";
}

export function normalizeGroupLabel(label) {
  const l = label.toLowerCase();
  if (l.startsWith("tot")) return "total";
  if (l.startsWith("loc")) return "local";
  if (l.startsWith("ext")) return "external";
  return slugifyLabel(label);
}

export function normalizeEnergyMetricLabel(label) {
  const lower = label.toLowerCase();
  if (lower.includes("hydropower")) {
    return "production_hydro_gwh";
  }
  if (lower.includes("wind") || lower.includes("solar")) {
    return "production_wind_solar_gwh";
  }
  if (lower.includes("gross production from power plants")) {
    return "production_thermal_gwh";
  }
  if (lower === "import") {
    return "import_gwh";
  }
  if (lower === "export") {
    return "export_gwh";
  }
  if (lower.includes("gross electricity available")) {
    return "gross_available_gwh";
  }
  if (lower.includes("household")) {
    return "household_consumption_gwh";
  }
  if (lower.includes("commercial")) {
    return "commercial_consumption_gwh";
  }
  if (lower.includes("industry")) {
    return "industry_consumption_gwh";
  }
  if (lower.includes("lighting")) {
    return "public_lighting_consumption_gwh";
  }
  if (lower.includes("220-110")) {
    return "high_voltage_consumption_gwh";
  }
  if (lower.includes("mining")) {
    return "mining_consumption_gwh";
  }
  if (lower.includes("consumption")) {
    return "consumption_total_gwh";
  }
  return `${slugifyLabel(label)}_gwh`;
}

export function normalizeWhitespace(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

const UPPERCASE_WORDS = new Set(["FOB", "CIF", "EU", "USA", "UK", "VAT"]);

export function smartTitleCase(word) {
  const trimmed = word.trim();
  if (!trimmed) return "";
  const alpha = trimmed.replace(/[^A-Za-z]/g, "");
  const upperAlpha = alpha.toUpperCase();
  if (upperAlpha && UPPERCASE_WORDS.has(upperAlpha)) {
    return trimmed.replace(alpha, upperAlpha);
  }
  return trimmed[0].toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function beautifyChapterText(text) {
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

export function maybeBeautifyChapterText(text) {
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

export function parseTradeChapterLabel(text) {
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
    code = leadingMatch[1].padStart(2, "0");
    remainder = remainder.slice(leadingMatch[0].length).trim();
  }
  if (!code) {
    const numberMatch =
      remainder.match(/\b\d{1,2}\b/) ?? raw.match(/\b\d{1,2}\b/);
    if (numberMatch) {
      code = numberMatch[0].padStart(2, "0");
    }
  }
  const splitParts = remainder.split(/\s*[-–—:]\s*/).map((part) => part.trim());
  let title = "";
  let description = "";
  if (splitParts.length > 1) {
    title = maybeBeautifyChapterText(splitParts.shift());
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

export function normalizeYM(code) {
  if (/^\d{6}$/.test(code)) {
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }
  if (code.includes("M")) {
    const [year, month] = code.split("M", 2);
    return `${year}-${month.padStart(2, "0")}`;
  }
  if (code.length === 7 && code[4] === "-") return code;
  return code;
}
