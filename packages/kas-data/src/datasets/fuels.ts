import fuelsDatasetJson from "../../data/kas_energy_fuels_monthly.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset, DatasetView } from "../utils/dataset";

import { FuelMetric, type FuelRecord } from "../types/energy";

type FuelDimensionKey = "fuel";

type FuelDatasetMeta = DatasetMetaMonthly<FuelMetric, FuelDimensionKey>;

type FuelDataset = Dataset<FuelRecord, FuelDatasetMeta>;
export type FuelDatasetView = DatasetView<FuelDataset>;
const fuelDatasetData = fuelsDatasetJson as FuelDataset;

export const fuelDataset = createDataset(fuelDatasetData);
