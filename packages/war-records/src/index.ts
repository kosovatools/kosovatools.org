export type {
  CrimeStats,
  CrimeStatsBreakdownEntry,
  MemorialVictim,
} from "./types";

export { crimeStats, findBreakdownCount } from "./data";

export {
  WarRecordsOverview,
  type WarRecordsOverviewProps,
} from "./components/war-records-overview";

export { VictimList, type VictimListProps } from "./components/victim-list";
export {
  AgeDistributionPlot,
  type AgeDistributionPlotProps,
} from "./components/age-distribution-plot";

export {
  WAR_RECORDS_TIMEFRAME_LABEL,
  buildWarRecordsDatasetSummary,
} from "./lib/copy";
