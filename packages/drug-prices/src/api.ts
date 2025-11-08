import { createDatasetApi } from "@workspace/dataset-api";

import type {
  DrugPriceRecord,
  DrugPriceRecordsDataset,
  DrugPriceSnapshot,
  DrugPriceVersionEntry,
  DrugPriceVersionsDataset,
  DrugReferencePrices,
  DrugReferenceCountry,
} from "./types";

const drugPricesDataset = createDatasetApi({ prefix: ["mh", "drug_prices"] });

const REFERENCE_PRICE_KEYS: readonly DrugReferenceCountry[] = [
  "macedonia",
  "montenegro",
  "croatia",
  "slovenia",
  "bulgaria",
  "estonia",
  "other",
];

const EMPTY_DATASET: DrugPriceRecordsDataset = {
  generated_at: new Date(0).toISOString(),
  records: [],
};

const EMPTY_VERSIONS: DrugPriceVersionsDataset = {
  generated_at: new Date(0).toISOString(),
  versions: [],
};

function toOptionalString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function toRequiredString(value: unknown): string | null {
  const normalised = toOptionalString(value);
  return normalised ?? null;
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const timestamp = Date.parse(trimmed);
  return Number.isNaN(timestamp)
    ? null
    : new Date(timestamp).toISOString().slice(0, 10);
}

function normalizeReferencePrices(value: unknown): DrugReferencePrices | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const normalized: DrugReferencePrices = {};
  let hasAny = false;

  for (const key of REFERENCE_PRICE_KEYS) {
    const numeric = toOptionalNumber(record[key]);
    if (numeric != null) {
      normalized[key] = numeric;
      hasAny = true;
    }
  }

  return hasAny ? normalized : null;
}

function normalizeSnapshot(entry: unknown): DrugPriceSnapshot | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const snapshot = entry as Partial<DrugPriceSnapshot> & {
    reference_prices?: unknown;
    reference_prices_secondary?: unknown;
  };

  const version = toRequiredString(snapshot.version);
  if (!version) {
    return null;
  }

  return {
    version,
    price_wholesale: toOptionalNumber(snapshot.price_wholesale),
    price_with_margin: toOptionalNumber(snapshot.price_with_margin),
    price_retail: toOptionalNumber(snapshot.price_retail),
    valid_until: toIsoDate(snapshot.valid_until),
    reference_prices: normalizeReferencePrices(snapshot.reference_prices),
    reference_prices_secondary: normalizeReferencePrices(
      snapshot.reference_prices_secondary,
    ),
  };
}

function normalizeRecord(entry: unknown): DrugPriceRecord | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const record = entry as Partial<DrugPriceRecord> & {
    reference_prices?: unknown;
    reference_prices_secondary?: unknown;
    version_history?: unknown;
  };

  const productName = toRequiredString(record.product_name);
  const latestVersion = toOptionalString(record.latest_version);

  if (!productName) {
    return null;
  }

  const versionHistoryRaw = Array.isArray(record.version_history)
    ? record.version_history
    : [];
  const version_history = versionHistoryRaw
    .map((item) => normalizeSnapshot(item))
    .filter((item): item is DrugPriceSnapshot => Boolean(item));

  const resolvedVersion = latestVersion ?? version_history[0]?.version ?? null;
  if (!resolvedVersion) {
    return null;
  }

  return {
    serial_number: toOptionalNumber(record.serial_number),
    product_name: productName,
    active_substance: toOptionalString(record.active_substance),
    atc_code: toOptionalString(record.atc_code),
    dose: toOptionalString(record.dose),
    pharmaceutical_form: toOptionalString(record.pharmaceutical_form),
    packaging: toOptionalString(record.packaging),
    marketing_authorisation_holder: toOptionalString(
      record.marketing_authorisation_holder,
    ),
    manufacturer: toOptionalString(record.manufacturer),
    authorization_number: toOptionalString(record.authorization_number),
    price_wholesale: toOptionalNumber(record.price_wholesale),
    price_with_margin: toOptionalNumber(record.price_with_margin),
    price_retail: toOptionalNumber(record.price_retail),
    valid_until: toIsoDate(record.valid_until),
    latest_version: resolvedVersion,
    version_history,
    reference_prices: normalizeReferencePrices(record.reference_prices),
    reference_prices_secondary: normalizeReferencePrices(
      record.reference_prices_secondary,
    ),
  };
}

export async function loadDrugPriceRecords(): Promise<DrugPriceRecordsDataset> {
  const payload = await drugPricesDataset.fetchJson<unknown>("records.json", {
    cache: "force-cache",
  });

  if (!payload || typeof payload !== "object") {
    return EMPTY_DATASET;
  }

  const generated_at =
    toOptionalString((payload as Record<string, unknown>).generated_at) ??
    EMPTY_DATASET.generated_at;

  const items = Array.isArray((payload as Record<string, unknown>).records)
    ? ((payload as Record<string, unknown>).records as unknown[])
    : [];

  const records = items
    .map((item) => normalizeRecord(item))
    .filter((item): item is DrugPriceRecord => Boolean(item));

  if (!records.length) {
    return { ...EMPTY_DATASET, generated_at };
  }

  return { generated_at, records };
}

export async function loadDrugPriceVersions(): Promise<DrugPriceVersionsDataset> {
  const payload = await drugPricesDataset.fetchJson<unknown>("versions.json", {
    cache: "force-cache",
  });

  if (!payload || typeof payload !== "object") {
    return EMPTY_VERSIONS;
  }

  const generated_at =
    toOptionalString((payload as Record<string, unknown>).generated_at) ??
    EMPTY_VERSIONS.generated_at;

  const entries = Array.isArray((payload as Record<string, unknown>).versions)
    ? ((payload as Record<string, unknown>).versions as unknown[])
    : [];

  const versions = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const item = entry as Partial<DrugPriceVersionEntry> & {
        valid_until_values?: unknown;
      };

      const version = toRequiredString(item.version);
      if (!version) {
        return null;
      }

      const record_count = toOptionalNumber(item.record_count);
      if (record_count == null) {
        return null;
      }

      const valid_until_values = Array.isArray(item.valid_until_values)
        ? item.valid_until_values
            .map((value) => toIsoDate(value))
            .filter((value): value is string => Boolean(value))
        : [];

      return {
        version,
        source_file: toOptionalString(item.source_file) ?? version,
        record_count,
        valid_until_values,
      } satisfies DrugPriceVersionEntry;
    })
    .filter((entry): entry is DrugPriceVersionEntry => Boolean(entry));

  if (!versions.length) {
    return { ...EMPTY_VERSIONS, generated_at };
  }

  return { generated_at, versions };
}
