"use client";
import {
  cpiAveragePricesYearly,
  cpiDataset,
  constructionCostIndexDataset,
} from "@workspace/kas-data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import { CpiChart } from "./charts/cpi-chart";
import { ConstructionCostIndexChart } from "./charts/construction-cost-chart";
import { CpiAveragePricesChart } from "./charts/cpi-average-prices-chart";

export function InflationTracker() {
  return (
    <div className="space-y-12">
      <DatasetRenderer dataset={cpiDataset}>
        {(dataset) => <CpiChart dataset={dataset} />}
      </DatasetRenderer>

      <DatasetRenderer
        dataset={cpiAveragePricesYearly}
        title="Çmimet mesatare vjetore"
        description="Analizo trendet e çmimeve për artikuj specifikë të shportës së CPI-së dhe krahaso deri në pesë produkte / shërbime në të njëjtin grafik."
      >
        {(dataset) => <CpiAveragePricesChart dataset={dataset} />}
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
