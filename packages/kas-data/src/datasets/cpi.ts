import cpiMonthlyJson from "../../data/kas_cpi_monthly.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset } from "../utils/dataset";

import type { CpiMetric, CpiRecord } from "../types/cpi";

type CpiMeta = DatasetMetaMonthly<CpiMetric, "group">;

export type CpiDataset = Dataset<CpiRecord, CpiMeta>;
const cpiDatasetData = cpiMonthlyJson as CpiDataset;

export const cpiDataset = createDataset(cpiDatasetData);
