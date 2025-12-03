"use client";

import { DailyFlowChart } from "./charts/energy-flow-daily-chart";
import { MonthlyFlowTrendChart } from "./charts/energy-flow-monthly-trend-chart";
import { loadDailyDataset, loadMonthlyDataset } from "./flow-service";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

export function EnergyFlowExplorer() {
  return (
    <div className="space-y-8">
      <DatasetRenderer
        datasetLoader={loadMonthlyDataset}
        queryKey={["energy-flow", "monthly-dataset"]}
        emptyStateContent="Nuk ka të dhëna mujore për flukset e energjisë."
        title="Trendi i flukseve mujore"
        id="monthly-flow-trend"
        description="Analizo importet, eksportet dhe bilancin neto të energjisë elektrike të Kosovës përgjatë periudhave të disponueshme nga ENTSO-E."
      >
        {(dataset) => (
          <MonthlyFlowTrendChart
            dataset={dataset}
            timelineEvents={{
              enabled: true,
              includeCategories: ["government_change"],
            }}
          />
        )}
      </DatasetRenderer>

      <DatasetRenderer
        datasetLoader={loadDailyDataset}
        queryKey={["energy-flow", "daily-dataset"]}
        emptyStateContent="Nuk ka ende të dhëna ditore për periudhën e fundit."
        title="Modeli ditor i flukseve"
        id="daily-flow-pattern"
        description="Shiko importet dhe eksportet ditore për muajin më të fundit të përpunuar nga ENTSO-E Transparency Platform."
      >
        {(dataset) => (
          <DailyFlowChart
            dataset={dataset}
            timelineEvents={{
              enabled: true,
              includeCategories: ["government_change"],
            }}
          />
        )}
      </DatasetRenderer>
    </div>
  );
}
