import cpiMonthlyJson from "../../data/kas_cpi_monthly.json" with { type: "json" };
import { createDataset } from "../utils/dataset";
import type { CpiDataset } from "../types/cpi";

const cpiDatasetData = cpiMonthlyJson as CpiDataset;

export const cpiDataset = createDataset(cpiDatasetData);
