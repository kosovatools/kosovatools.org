"use client";
import { cpiDataset, constructionCostIndexDataset } from "@workspace/kas-data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import { CpiChart } from "./charts/cpi-chart";
import { ConstructionCostIndexChart } from "./charts/construction-cost-chart";

export function InflationTracker() {
  return (
    <div className="space-y-12">
      <DatasetRenderer dataset={cpiDataset}>
        {(dataset) => <CpiChart dataset={dataset} />}
      </DatasetRenderer>

      <DatasetRenderer
        dataset={constructionCostIndexDataset}
        title="Indeksi i kostos së ndërtimit"
        description="Krahaso kostot tremujore të materialeve, pagave dhe komponentëve të tjerë për ndërtesat shumëkatëshe (baza 2015 = 100)."
      >
        {(dataset) => <ConstructionCostIndexChart dataset={dataset} />}
      </DatasetRenderer>
    </div>
  );
}
