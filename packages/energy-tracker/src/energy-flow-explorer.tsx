"use client";

import { DailyFlowChart } from "./charts/energy-flow-daily-chart";
import { MonthlyFlowTrendChart } from "./charts/energy-flow-monthly-trend-chart";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import { loadDataset } from "@workspace/data";

export function EnergyFlowExplorer() {
  return (
    <div className="space-y-8">
      <DatasetRenderer
        datasetLoader={() => loadDataset("energy.crossborder-monthly")}
        queryKey={["energy-flow", "monthly-dataset"]}
        emptyStateContent="Nuk ka të dhëna mujore për flukset e energjisë."
        title="Flukset neto mujore ndërkufitare"
        id="monthly-flow-trend"
        description="Shiko bilancin neto (import minus eksport) të energjisë elektrike sipas fqinjëve, në periudhat e mbledhura nga ENTSO-E. Vlerat tregojnë rrjedhën neto në rrjet dhe mund të përfshijnë tranzit, prandaj nuk përfaqësojnë domosdoshmërisht blerje nga vendi përkatës."
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
        datasetLoader={() => loadDataset("energy.crossborder-daily-v2")}
        queryKey={["energy-flow", "daily-dataset-v2"]}
        emptyStateContent="Nuk ka ende të dhëna ditore për periudhën e fundit."
        title="Bilanci ditor neto ndërkufitar"
        id="daily-flow-pattern"
        description="Vëzhgo bilancin neto ditor të flukseve kufitare sipas fqinjëve për muajin më të fundit të përpunuar nga ENTSO-E. Shifrat tregojnë rrjedhën neto në rrjet dhe mund të përfshijnë tranzit, ndaj nuk barazohen gjithmonë me blerje direkte nga ai vend."
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
