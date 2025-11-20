"use client";

import {
  governmentExpenditureQuarterly,
  governmentRevenueQuarterly,
  type GovernmentExpenditureDatasetView,
  type GovernmentRevenueDatasetView,
} from "@workspace/kas-data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

import { GovernmentExpenditureStackedChart } from "./charts/government-expenditure-chart";
import { GovernmentRevenueStackedChart } from "./charts/government-revenue-chart";

export function GovernmentFinanceSection() {
  return (
    <div className="space-y-10">
      <DatasetRenderer<GovernmentRevenueDatasetView>
        dataset={governmentRevenueQuarterly}
        isEmpty={(data) => data.records.length === 0}
        title="Të hyrat e Qeverisë së Përgjithshme (ESA 2010)"
        description="Struktura tremujore e të hyrave sipas ESA: tatime, transferta dhe hyrje nga prona."
      >
        {(dataset) => <GovernmentRevenueStackedChart dataset={dataset} />}
      </DatasetRenderer>

      <DatasetRenderer<GovernmentExpenditureDatasetView>
        dataset={governmentExpenditureQuarterly}
        isEmpty={(data) => data.records.length === 0}
        title="Shpenzimet e Qeverisë së Përgjithshme (ESA 2010)"
        description="Shpenzimet tremujore sipas funksioneve ESA, përfshirë kompensimet, subvencionet dhe investimet kapitale."
      >
        {(dataset) => (
          <GovernmentExpenditureStackedChart
            dataset={dataset}
            title="Shpenzimet tremujore"
            selectionLabel="Zgjedh kategoritë e shpenzimeve"
            searchPlaceholder="Kërko në kategoritë e shpenzimeve..."
          />
        )}
      </DatasetRenderer>
    </div>
  );
}
