"use client";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import type { ElectricityDataset } from "@workspace/data";
import { ElectricityBalanceStackedAreaChart } from "./charts/electricity-balance-stacked-area";
import { ElectricityProductionStackedAreaChart } from "./charts/electricity-production-stacked-area";

export function EnergyImportAndProduction({
  dataset,
}: {
  dataset: ElectricityDataset;
}) {
  return (
    <>
      <DatasetRenderer
        dataset={dataset}
        title="Importet kundrejt prodhimit vendas"
        id="energy-imports-vs-production"
        description="Krahaso importet mujore të energjisë elektrike me prodhimin vendor për të parë se si ndryshon varësia nga energjia e importuar në periudha të shkurtra ose të zgjatura."
      >
        {(dataset) => <ElectricityBalanceStackedAreaChart dataset={dataset} />}
      </DatasetRenderer>
      <DatasetRenderer
        dataset={dataset}
        title="Si ndryshon prodhimi vendas sipas burimit"
        id="energy-production-by-source"
        description="Shiko sa kontribojnë termocentralet, hidrocentralet dhe burimet me erë ose diell në prodhimin total vendor për të identifikuar periudhat kur burimet e ripërtritshme mbulojnë më shumë kërkesën."
      >
        {(dataset) => (
          <ElectricityProductionStackedAreaChart dataset={dataset} />
        )}
      </DatasetRenderer>
    </>
  );
}
