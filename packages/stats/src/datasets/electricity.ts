import energyElectricity from "../../data/kas_energy_electricity_monthly.json" with { type: "json" };

export type ElectricityRecord = {
  period: string;
  import_gwh: number | null;
  production_gwh: number | null;
};

export const electricityMonthly: ElectricityRecord[] = (
  energyElectricity as ElectricityRecord[]
).slice(0);
