import energyElectricity from "../../data/kas_energy_electricity_monthly.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset } from "../utils/dataset";

import type {
  EnergyRecord as ElectricityRecord,
  EnergyMetric as ElectricityMetric,
} from "../types/energy";

type ElectricityMeta = DatasetMetaMonthly<ElectricityMetric>;

export type ElectricityDataset = Dataset<ElectricityRecord, ElectricityMeta>;
const electricityData = energyElectricity as ElectricityDataset;

export const electricityDataset = createDataset(electricityData);
