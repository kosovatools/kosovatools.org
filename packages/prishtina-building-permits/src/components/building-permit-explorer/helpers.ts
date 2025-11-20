import type { BuildingPermitRecord } from "@workspace/dataset-api";

export const collator = new Intl.Collator("sq");

export function sumRecords(
  records: BuildingPermitRecord[],
  selector: (record: BuildingPermitRecord) => number | null | undefined,
): number {
  return records.reduce((total, record) => {
    const value = selector(record);
    if (typeof value === "number" && Number.isFinite(value)) {
      return total + value;
    }
    return total;
  }, 0);
}

export function toOptionLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
