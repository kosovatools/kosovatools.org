import fuelsDatasetJson from "../../data/kas_energy_fuels_monthly.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset } from "../utils/dataset";

import { FuelMetric, type FuelRecord } from "../types/energy";

type FuelDimensionKey = "fuel";

type FuelDatasetMeta = DatasetMetaMonthly<FuelMetric, FuelDimensionKey>;

export type FuelDataset = Dataset<FuelRecord, FuelDatasetMeta>;
const fuelDatasetData = fuelsDatasetJson as FuelDataset;

export const fuelDataset = createDataset(fuelDatasetData);
