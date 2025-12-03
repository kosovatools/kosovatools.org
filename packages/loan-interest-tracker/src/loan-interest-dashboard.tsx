"use client";

import { LoanInterestExplorerChart } from "./charts/loan-interest-explorer-chart";
import { LoanInterestSegmentChart } from "./charts/loan-interest-segment-chart";
import { loadLoanInterestDataset } from "@workspace/data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

export function LoanInterestDashboard() {
  return (
    <div className="space-y-10">
      <DatasetRenderer
        id="loan-interest-overview"
        title="Normat mesatare të interesit për kreditë e reja"
        description="Krahaso normat mujore për totalin, ekonomitë familjare dhe korporatat jofinanciare. Filtrat kohorë ndihmojnë për të parë ndryshimet pas 2020 ose vitet e fundit."
        datasetLoader={loadLoanInterestDataset}
        queryKey={["cbk", "loan-interests"]}
      >
        {(dataset) => (
          <LoanInterestSegmentChart
            dataset={dataset}
            timelineEvents={{
              enabled: true,
              includeCategories: ["security", "banking"],
            }}
          />
        )}
      </DatasetRenderer>

      <DatasetRenderer
        id="loan-interest-explorer"
        title="Eksploro segmentet dhe maturitetet"
        description="Përdor hierarkinë e kodeve të CBK për të zgjedhur produkte specifike (hipotekat sipas afatit, kartelat, linjat kreditore) dhe krahaso trendet mujore."
        datasetLoader={loadLoanInterestDataset}
        queryKey={["cbk", "loan-interests"]}
      >
        {(dataset) => (
          <LoanInterestExplorerChart
            dataset={dataset}
            timelineEvents={{
              enabled: true,
              includeCategories: ["security", "banking"],
            }}
          />
        )}
      </DatasetRenderer>
    </div>
  );
}
