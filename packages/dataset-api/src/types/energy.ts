import type {
  DatasetMeta,
  DatasetMetaBaseExtras,
  DatasetMetaMonthly,
} from "@workspace/kas-data";

export type EnergyMonthlyMetric = "import" | "export" | "net";

export type EnergyMonthlyRecord = {
  period: string;
  neighbor: string;
  import: number;
  export: number;
  net: number;
  has_data: boolean;
};

export type EnergyMonthlyDatasetMeta = DatasetMetaMonthly<
  EnergyMonthlyMetric | "has_data",
  "neighbor"
>;

export type EnergyDailyRecord = {
  period: string;
  import: number;
  export: number;
  net: number;
};

export type EnergyDailyDatasetMeta = DatasetMeta<
  EnergyMonthlyMetric,
  never,
  "daily",
  DatasetMetaBaseExtras
>;

export type EnergyFlowTotals = {
  importMWh: number;
  exportMWh: number;
  netMWh: number;
};

export type EnergyFlowResult = {
  code: string;
  country: string;
  importMWh: number;
  exportMWh: number;
  netMWh: number;
  hasData: boolean;
};

export type EnergyFlowHourlyEntry = {
  hour: number;
  importMWh: number;
  exportMWh: number;
  netMWh: number;
};
