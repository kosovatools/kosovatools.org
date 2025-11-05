import crimeStatsJson from "../../data/crime-stats.json" assert { type: "json" };

import type { CrimeStats } from "../types";

export const crimeStats = crimeStatsJson as CrimeStats;

export function findBreakdownCount(
  entries: CrimeStats["statusBreakdown"],
  value: string,
): number {
  const match = entries.find((entry) => entry.value === value);
  return match?.count ?? 0;
}
