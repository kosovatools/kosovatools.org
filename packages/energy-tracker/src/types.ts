export type EnergyFlowResult = {
  code: string;
  country: string;
  importMWh: number;
  exportMWh: number;
  netMWh: number;
  hasData: boolean;
};
export type EnergyFlowTotals = {
  importMWh: number;
  exportMWh: number;
  netMWh: number;
};
export type EnergyFlowSnapshot = {
  id: string;
  periodStart: string;
  periodEnd: string;
  neighbors: EnergyFlowResult[];
  totals: EnergyFlowTotals;
};

// NEW: index + daily
export type EnergyFlowIndex = {
  generatedAt: string;
  months: Array<{
    id: string;
    periodStart: string;
    periodEnd: string;
    totals: EnergyFlowTotals;
  }>;
};
export type EnergyFlowDailyPoint = {
  date: string;
  imports: number;
  exports: number;
  net: number;
};
export type EnergyFlowDailyLatest = {
  snapshotId: string;
  periodStart: string;
  periodEnd: string;
  days: EnergyFlowDailyPoint[];
};

export type EnergyFlowMonthlyPoint = {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  imports: number;
  exports: number;
  net: number;
};

export type EnergyFlowHourlyEntry = {
  hour: number;
  importMWh: number;
  exportMWh: number;
  netMWh: number;
};
