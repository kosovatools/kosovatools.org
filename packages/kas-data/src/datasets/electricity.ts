import energyElectricity from "../../data/kas_energy_electricity_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

export type ElectricityRecord = {
  period: string;
  production_gwh: number | null;
  production_thermal_gwh?: number | null;
  production_hydro_gwh?: number | null;
  production_wind_solar_gwh?: number | null;
  import_gwh: number | null;
  export_gwh?: number | null;
  gross_available_gwh?: number | null;
  household_consumption_gwh?: number | null;
  commercial_consumption_gwh?: number | null;
  industry_consumption_gwh?: number | null;
  public_lighting_consumption_gwh?: number | null;
  high_voltage_consumption_gwh?: number | null;
  mining_consumption_gwh?: number | null;
  consumption_total_gwh?: number | null;
};

type ElectricityMetric =
  Exclude<keyof ElectricityRecord, "period"> extends infer Keys
    ? Keys extends string
      ? Keys
      : never
    : never;

export type ElectricityMeta = DatasetMeta<ElectricityMetric>;

type ElectricityDataset = Dataset<ElectricityRecord, ElectricityMeta>;

export const electricityDataset = energyElectricity as ElectricityDataset;
