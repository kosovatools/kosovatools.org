"use client";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import type { AirTransportDataset } from "@workspace/data";
import { AviationStatsChart } from "./charts/aviation-stats-chart";

export function AviationStats({ dataset }: { dataset: AirTransportDataset }) {
  return (
    <DatasetRenderer
      dataset={dataset}
      id="aviation-stats"
      title="Statistikat e Aviacionit"
    >
      {(dataset) => (
        <AviationStatsChart
          dataset={dataset}
          timelineEvents={{
            enabled: true,
            includeCategories: ["travel", "public_health"],
          }}
        />
      )}
    </DatasetRenderer>
  );
}
