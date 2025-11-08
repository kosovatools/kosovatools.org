import type { DrugPriceRecord, DrugReferencePrices } from "../types";
import { REFERENCE_PRICE_LABELS } from "../constants";

export type ReferenceSection = {
  title: string;
  entries: Array<{ label: string; value: number }>;
};

export function createRecordId(record: DrugPriceRecord, index: number): string {
  const baseIdentifier =
    record.authorization_number ??
    (record.serial_number != null ? String(record.serial_number) : null) ??
    record.product_name ??
    "record";

  return `${baseIdentifier}-${index}`;
}

export function buildSearchText(record: DrugPriceRecord): string {
  return [
    record.product_name,
    record.active_substance,
    record.atc_code,
    record.dose,
    record.pharmaceutical_form,
    record.packaging,
    record.marketing_authorisation_holder,
    record.manufacturer,
    record.authorization_number,
    record.latest_version,
  ]
    .map((value) => (value ?? "").toString().toLowerCase())
    .join(" ");
}

function referenceEntries(map?: DrugReferencePrices | null) {
  if (!map) return [] as Array<{ label: string; value: number }>;
  return (
    Object.keys(REFERENCE_PRICE_LABELS) as Array<
      keyof typeof REFERENCE_PRICE_LABELS
    >
  )
    .map((key) => {
      const value = map[key];
      if (value == null) return null;
      return { label: REFERENCE_PRICE_LABELS[key], value };
    })
    .filter((entry): entry is { label: string; value: number } =>
      Boolean(entry),
    );
}

export function getReferenceSections(
  record: DrugPriceRecord,
): ReferenceSection[] {
  const sections: ReferenceSection[] = [];
  const primary = referenceEntries(record.reference_prices);
  if (primary.length) {
    sections.push({
      title: "Çmimet referente (primare)",
      entries: primary,
    });
  }
  const secondary = referenceEntries(record.reference_prices_secondary);
  if (secondary.length) {
    sections.push({
      title: "Çmimet referente (sekondare)",
      entries: secondary,
    });
  }
  return sections;
}

export function hasExpandableDetails(record: DrugPriceRecord): boolean {
  return (
    (record.version_history?.length ?? 0) > 1 ||
    Boolean(record.reference_prices) ||
    Boolean(record.reference_prices_secondary)
  );
}
