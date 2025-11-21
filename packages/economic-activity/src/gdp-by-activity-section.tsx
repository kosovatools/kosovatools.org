"use client";

import {
  type GdpByActivityDatasetView,
  gdpByActivityQuarterly,
} from "@workspace/kas-data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

import { GdpActivityStackedChart } from "./charts/gdp-activity-stacked-chart";

export function GdpByActivitySection() {
  return (
    <DatasetRenderer<GdpByActivityDatasetView>
      dataset={gdpByActivityQuarterly}
      isEmpty={(data) => data.records.length === 0}
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
