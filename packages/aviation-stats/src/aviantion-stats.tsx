"use client";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import { loadDataset, type AirTransportDataset } from "@workspace/data";
import { AviationStatsChart } from "./charts/aviation-stats-chart";

export function AviationStats({
  initialDataset,
}: {
  initialDataset?: AirTransportDataset;
}) {
  return (
    <DatasetRenderer
      datasetLoader={() => loadDataset("kas.air-transport")}
      queryKey={["kas", "aviation", "air-transport"]}
      initialData={initialDataset}
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
