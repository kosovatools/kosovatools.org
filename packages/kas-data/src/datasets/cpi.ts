import cpiMonthlyJson from "../../data/kas_cpi_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

export type CpiMetric = "index" | "change";

export type CpiRecord = {
  period: string;
  group: string;
} & Record<CpiMetric, number | null>;

export type CpiMeta = DatasetMeta<CpiMetric, "group">;

type CpiDataset = Dataset<CpiRecord, CpiMeta>;

const cpiDataset = cpiMonthlyJson as CpiDataset;

export const cpiMeta = cpiDataset.meta;
export const cpiMonthly = cpiDataset.records;
export { cpiDataset };
