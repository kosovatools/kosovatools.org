import type { DatasetMetaQuarterly } from "./dataset";

export type GdpByActivityMetric = "nominal_eur" | "real_eur";

export type GdpByActivityCategory = "activity" | "aggregate";

export type GdpByActivityRecord = {
  period: string;
  activity: string;
  category: GdpByActivityCategory;
  nominal_eur: number | null;
  real_eur: number | null;
};

export type GdpByActivityMeta = DatasetMetaQuarterly<
  GdpByActivityMetric,
  "activity",
  { aggregates: string[] }
>;
