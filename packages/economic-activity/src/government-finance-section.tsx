"use client";

import type {
  GovernmentExpenditureDataset,
  GovernmentRevenueDataset,
} from "@workspace/data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

import { GovernmentExpenditureStackedChart } from "./charts/government-expenditure-chart";
import { GovernmentRevenueStackedChart } from "./charts/government-revenue-chart";

export function GovernmentFinanceSection({
  revenue,
  expenditure,
}: {
  revenue: GovernmentRevenueDataset;
  expenditure: GovernmentExpenditureDataset;
}) {
  return (
    <div className="space-y-10">
      <DatasetRenderer
        dataset={revenue}
        title="Të hyrat e Qeverisë së Përgjithshme (ESA 2010)"
        id="government-revenue"
        description="Struktura tremujore e të hyrave sipas ESA: tatime, transferta dhe hyrje nga prona."
      >
        {(dataset) => (
          <GovernmentRevenueStackedChart
            dataset={dataset}
            timelineEvents={{
              enabled: true,
              includeCategories: [
                "government_change",
                "public_health",
                "other",
              ],
            }}
          />
        )}
      </DatasetRenderer>

      <DatasetRenderer
        dataset={expenditure}
        title="Shpenzimet e Qeverisë së Përgjithshme (ESA 2010)"
        id="government-expenditure"
        description="Shpenzimet tremujore sipas funksioneve ESA, përfshirë kompensimet, subvencionet dhe investimet kapitale."
      >
        {(dataset) => (
          <GovernmentExpenditureStackedChart
            dataset={dataset}
            title="Shpenzimet tremujore"
            selectionLabel="Zgjedh kategoritë e shpenzimeve"
            searchPlaceholder="Kërko në kategoritë e shpenzimeve..."
            timelineEvents={{
              enabled: true,
              includeCategories: [
                "government_change",
                "public_health",
                "security",
              ],
            }}
          />
        )}
      </DatasetRenderer>
    </div>
  );
}
