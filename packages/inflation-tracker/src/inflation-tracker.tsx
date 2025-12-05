"use client";
import {
  loadDataset,
  type ConstructionCostIndexDataset,
  type CpiAveragePriceDataset,
  type CpiDataset,
} from "@workspace/data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import { CpiChart } from "./charts/cpi-chart";
import { ConstructionCostIndexChart } from "./charts/construction-cost-chart";
import { CpiAveragePricesChart } from "./charts/cpi-average-prices-chart";

type InflationTrackerProps = {
  initialCpiDataset?: CpiDataset;
  initialCpiAveragePricesYearly?: CpiAveragePriceDataset;
  initialConstructionCostIndexDataset?: ConstructionCostIndexDataset;
};

export function InflationTracker({
  initialCpiDataset,
  initialCpiAveragePricesYearly,
  initialConstructionCostIndexDataset,
}: InflationTrackerProps) {
  return (
    <div className="space-y-12">
      <DatasetRenderer
        datasetLoader={() => loadDataset("cpi.headline")}
        queryKey={["kas", "cpi", "monthly"]}
        initialData={initialCpiDataset}
        id="cpi-index"
        title="Indeksi i Çmimeve të Konsumit"
      >
        {(dataset) => (
          <CpiChart
            dataset={dataset}
            timelineEvents={{
              enabled: true,
              includeCategories: [
                "public_health",
                "security",
                "government_change",
              ],
            }}
          />
        )}
      </DatasetRenderer>

      <DatasetRenderer
        datasetLoader={() => loadDataset("cpi.average-prices")}
        queryKey={["kas", "cpi", "average-prices", "yearly"]}
        initialData={initialCpiAveragePricesYearly}
        title="Çmimet mesatare vjetore"
        id="cpi-average-prices"
        description="Analizo trendet e çmimeve për artikuj specifikë të shportës së CPI-së dhe krahaso deri në pesë produkte / shërbime në të njëjtin grafik."
      >
        {(dataset) => <CpiAveragePricesChart dataset={dataset} />}
      </DatasetRenderer>

      <DatasetRenderer
        datasetLoader={() => loadDataset("construction.cost-index")}
        queryKey={["kas", "construction-cost-index", "quarterly"]}
        initialData={initialConstructionCostIndexDataset}
        title="Indeksi i kostos së ndërtimit"
        id="construction-cost-index"
        description="Krahaso kostot tremujore të materialeve, pagave dhe komponentëve të tjerë për ndërtesat shumëkatëshe (baza 2015 = 100)."
      >
        {(dataset) => (
          <ConstructionCostIndexChart
            dataset={dataset}
            timelineEvents={{
              enabled: true,
              includeCategories: ["security", "public_health"],
            }}
          />
        )}
      </DatasetRenderer>
    </div>
  );
}
