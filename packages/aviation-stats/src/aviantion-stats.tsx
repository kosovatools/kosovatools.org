"use client";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import { airTransportMonthly } from "@workspace/kas-data";
import { AviationStatsChart } from "./charts/aviation-stats-chart";

export function AviationStats() {
  return (
    <DatasetRenderer dataset={airTransportMonthly}>
      {(dataset) => <AviationStatsChart dataset={dataset} />}
    </DatasetRenderer>
  );
}
