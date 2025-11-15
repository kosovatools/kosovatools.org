import {
  DEFAULT_TIME_RANGE,
  sanitizeValue,
  type StackChartSpec,
  getPeriodGroupingOptions,
  type ValueFormatter,
} from "@workspace/utils";
import { electricityDataset, createLabelMap } from "@workspace/kas-data";
import { formatAuto } from "../utils/number-format";

const labelMap = createLabelMap(electricityDataset.meta.fields);
const DEFAULT_ENERGY_UNIT: "GWh" | "MWh" =
  electricityDataset.meta.unit === "MWh" ? "MWh" : "GWh";

const formatEnergy: ValueFormatter = (value) =>
  formatAuto(value, { inputUnit: DEFAULT_ENERGY_UNIT });

export type ElectricityBalanceFlow = "production" | "import";

export type ElectricityBalanceStackRecord = {
  period: string;
  flow: ElectricityBalanceFlow;
  value: number;
};

const flowLabels: Readonly<Record<ElectricityBalanceFlow, string>> = {
  production: labelMap.production_gwh,
  import: labelMap.import_gwh,
};

export const electricityBalanceStackChartSpec: StackChartSpec<ElectricityBalanceStackRecord> =
  {
    id: "energy.electricity.balance",
    datasetId: electricityDataset.meta.id,
    title: "Bilanci i energjisë",
    description: "Prodhimi vendor kundrejt importeve për periudhën e zgjedhur.",
    dimensionField: "flow",
    dimensionLabel: "Fluksi",
    dimensionLabels: flowLabels,
    defaultMetricKey: "value",
    metrics: [
      {
        key: "value",
        label: "Energjia",
        formatters: {
          axis: formatEnergy,
          value: formatEnergy,
          total: formatEnergy,
          summary: formatEnergy,
        },
        getValue: (record) => sanitizeValue(record.value, 0),
      },
    ],
    defaults: {
      periodGrouping: "seasonal",
      timeRange: DEFAULT_TIME_RANGE,
      includeOther: false,
    },
    periodGroupingOptions: getPeriodGroupingOptions(
      electricityDataset.meta.time.granularity,
    ),
    controls: {
      allowPeriodGrouping: true,
      allowTimeRange: true,
    },
  };

export type ElectricityProductionSource =
  | "production_thermal_gwh"
  | "production_hydro_gwh"
  | "production_wind_solar_gwh";

export type ElectricityProductionStackRecord = {
  period: string;
  source: ElectricityProductionSource;
  value: number;
};

const sourceLabels: Readonly<Record<ElectricityProductionSource, string>> = {
  production_thermal_gwh: labelMap.production_thermal_gwh,
  production_hydro_gwh: labelMap.production_hydro_gwh,
  production_wind_solar_gwh: labelMap.production_wind_solar_gwh,
};

export const electricityProductionStackChartSpec: StackChartSpec<ElectricityProductionStackRecord> =
  {
    id: "energy.electricity.production",
    datasetId: electricityDataset.meta.id,
    title: "Prodhimi sipas burimit",
    description:
      "Kontributet e termocentraleve, hidrocentralit dhe burimeve me erë/diell.",
    dimensionField: "source",
    dimensionLabel: "Burimi",
    dimensionLabels: sourceLabels,
    defaultMetricKey: "value",
    metrics: [
      {
        key: "value",
        label: "Prodhimi",
        formatters: {
          axis: formatEnergy,
          value: formatEnergy,
          total: formatEnergy,
          summary: formatEnergy,
        },
        getValue: (record) => sanitizeValue(record.value, 0),
      },
    ],
    defaults: {
      periodGrouping: "seasonal",
      timeRange: DEFAULT_TIME_RANGE,
      includeOther: false,
    },
    periodGroupingOptions: getPeriodGroupingOptions(
      electricityDataset.meta.time.granularity,
    ),
    controls: {
      allowPeriodGrouping: true,
      allowTimeRange: true,
    },
  };
