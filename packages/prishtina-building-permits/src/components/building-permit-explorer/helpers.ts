import {
  formatDate,
  formatCurrency,
  formatNumber,
  type DateInput,
} from "@workspace/utils";

import type { BuildingPermitRecord } from "../../types";

export const dateFormatter = (value: DateInput) => formatDate(value);

export const dateTimeFormatter = (value: DateInput) =>
  formatDate(value, {
    dateStyle: "long",
    timeStyle: "short",
  });

export const areaFormatter = (value: number | null | undefined) =>
  formatNumber(value, {
    maximumFractionDigits: 2,
  });

export const euroFormatter = (value: number | null | undefined) =>
  formatCurrency(value);

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
