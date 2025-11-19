"use client";
import { cpiDataset } from "@workspace/kas-data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import { CpiChart } from "./charts/cpi-chart";

export function InflationTracker() {
  return (
    <DatasetRenderer dataset={cpiDataset}>
      {(dataset) => <CpiChart dataset={dataset} />}
    </DatasetRenderer>
  );
}
