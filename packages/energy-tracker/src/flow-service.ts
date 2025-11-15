import { createDatasetFetcher } from "@workspace/dataset-api";
import { formatDate } from "@workspace/utils";

import type {
  EnergyFlowDailyLatest,
  EnergyFlowIndex,
  EnergyFlowSnapshot,
} from "./types";

const DATASET_PREFIX = ["energy"] as const;
const fetchEnergyDataset = createDatasetFetcher(DATASET_PREFIX, {
  label: "energy-flow",
});

export function loadIndex(): Promise<EnergyFlowIndex> {
  return fetchEnergyDataset<EnergyFlowIndex>("index.json");
}

export function loadMonthly(id: string): Promise<EnergyFlowSnapshot> {
  if (!id) {
    throw new Error("Missing snapshot id");
  }
  return fetchEnergyDataset<EnergyFlowSnapshot>(`monthly/${id}.json`);
}

export function loadLatestDaily(): Promise<EnergyFlowDailyLatest> {
  return fetchEnergyDataset<EnergyFlowDailyLatest>("latest-daily.json");
}

export function formatPeriodLabel(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Periudhë e panjohur";
  }

  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  } as const;

  const formattedStart = formatDate(startDate, options, {
    fallback: "",
    preserveInputOnInvalid: false,
  });
  const formattedEnd = formatDate(endDate, options, {
    fallback: "",
    preserveInputOnInvalid: false,
  });

  if (!formattedStart || !formattedEnd) {
    return "Periudhë e panjohur";
  }

  return `${formattedStart} → ${formattedEnd}`;
}
