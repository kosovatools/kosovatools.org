import {
  DEFAULT_TIME_RANGE,
  formatCount,
  sanitizeValue,
  type StackChartSpec,
  getPeriodGroupingOptions,
  type ValueFormatter,
} from "@workspace/utils";
import {
  fuelDataset,
  type FuelBalanceRecord,
  createLabelMap,
} from "@workspace/kas-data";
import { formatCountValue } from "../formatters";

const fuelLabelMap = createLabelMap(fuelDataset.meta.dimensions.fuel);
const periodGroupingOptions = getPeriodGroupingOptions(
  fuelDataset.meta.time.granularity,
);

const formatTonnes: ValueFormatter = (value) =>
  `${formatCountValue(value)} tonë`;

export const fuelBalanceStackChartSpec: StackChartSpec<FuelBalanceRecord> = {
  id: "kas.fuel-balance.stacked",
  datasetId: fuelDataset.meta.id,
  title: "Bilanci i furnizimit me karburante",
  description:
    "Disponueshmëria mujore sipas llojit të karburantit dhe metrikës së zgjedhur.",
  dimensionField: "fuel",
  dimensionLabel: "Karburanti",
  dimensionLabels: fuelLabelMap,
  defaultMetricKey: "ready_for_market",
  metrics: [
    {
      key: "production",
      label: "Prodhimi vendor",
      formatters: {
        axis: formatCount,
        value: formatTonnes,
        total: formatTonnes,
        summary: formatTonnes,
      },
      getValue: (record) => sanitizeValue(record.production, 0),
    },
    {
      key: "import",
      label: "Importet",
      formatters: {
        axis: formatCount,
        value: formatTonnes,
        total: formatTonnes,
        summary: formatTonnes,
      },
      getValue: (record) => sanitizeValue(record.import, 0),
    },
    {
      key: "export",
      label: "Eksportet",
      formatters: {
        axis: formatCount,
        value: formatTonnes,
        total: formatTonnes,
        summary: formatTonnes,
      },
      getValue: (record) => sanitizeValue(record.export, 0),
    },
    {
      key: "stock",
      label: "Stoqet",
      formatters: {
        axis: formatCount,
        value: formatTonnes,
        total: formatTonnes,
        summary: formatTonnes,
      },
      getValue: (record) => sanitizeValue(record.stock, 0),
    },
    {
      key: "ready_for_market",
      label: "Gati për treg",
      formatters: {
        axis: formatCount,
        value: formatTonnes,
        total: formatTonnes,
        summary: formatTonnes,
      },
      getValue: (record) => sanitizeValue(record.ready_for_market, 0),
    },
  ],
  defaults: {
    periodGrouping: "monthly",
    timeRange: DEFAULT_TIME_RANGE,
    includeOther: false,
  },
  periodGroupingOptions,
  controls: {
    allowMetricSelection: true,
    allowPeriodGrouping: true,
    allowTimeRange: true,
  },
};
