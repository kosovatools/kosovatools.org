"use client";

import { useQuery } from "@tanstack/react-query";

import { DailyFlowChart } from "./charts/energy-flow-daily-chart";
import { MonthlyFlowTrendChart } from "./charts/energy-flow-monthly-trend-chart";
import { loadDailyDataset, loadMonthlyDataset } from "./flow-service";
import type {
  EnergyDailyDatasetView,
  EnergyMonthlyDatasetView,
} from "@workspace/dataset-api";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

export function EnergyFlowExplorer() {
  const monthlyQuery = useQuery<EnergyMonthlyDatasetView, Error>({
    queryKey: ["energy-flow", "monthly-dataset"],
    queryFn: loadMonthlyDataset,
    staleTime: Infinity,
  });

  const dailyQuery = useQuery<EnergyDailyDatasetView, Error>({
    queryKey: ["energy-flow", "daily-dataset"],
    queryFn: loadDailyDataset,
    staleTime: Infinity,
  });

  return (
    <div className="space-y-8">
      <DatasetRenderer
        query={monthlyQuery}
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
        query={dailyQuery}
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
