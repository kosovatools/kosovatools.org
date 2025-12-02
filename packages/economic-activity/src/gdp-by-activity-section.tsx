"use client";

import type { GdpByActivityDataset } from "@workspace/data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

import { GdpActivityStackedChart } from "./charts/gdp-activity-stacked-chart";

export function GdpByActivitySection({
  dataset,
}: {
  dataset: GdpByActivityDataset;
}) {
  return (
    <DatasetRenderer
      dataset={dataset}
      title="BPV sipas aktiviteteve ekonomike"
      id="gdp-by-activity"
      description="Kontributi tremujor i degëve ekonomike në bruto produktin vendor, si në çmime aktuale (nominale) ashtu edhe në çmime të vitit paraprak (reale)."
    >
      {(dataset) => (
        <GdpActivityStackedChart
          dataset={dataset}
          timelineEvents={{
            enabled: true,
            includeCategories: ["government_change", "public_health", "other"],
          }}
        />
      )}
    </DatasetRenderer>
  );
}
