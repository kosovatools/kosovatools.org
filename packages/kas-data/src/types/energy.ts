import { FUEL_SPECS } from "./constants";

export type EnergyMetric =
  | "production_thermal_gwh"
  | "production_hydro_gwh"
  | "production_wind_solar_gwh"
  | "import_gwh"
  | "export_gwh"
  | "gross_available_gwh"
  | "household_consumption_gwh"
  | "commercial_consumption_gwh"
  | "industry_consumption_gwh"
  | "public_lighting_consumption_gwh"
  | "high_voltage_consumption_gwh"
  | "mining_consumption_gwh"
  | "consumption_total_gwh"
  | "production_gwh";

export type EnergyRecord = {
  period: string;
} & Record<EnergyMetric, number | null>;

export type FuelMetric =
  | "production"
  | "import"
  | "export"
  | "stock"
  | "ready_for_market";

export type FuelRecord = { period: string } & Record<
  FuelMetric,
  number | null
> & {
    fuel: keyof typeof FUEL_SPECS;
  };
