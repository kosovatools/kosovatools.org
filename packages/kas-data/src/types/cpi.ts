export type CpiMetric = "index" | "change";

export type CpiRecord = {
  period: string;
  group: string;
} & Record<CpiMetric, number | null>;
