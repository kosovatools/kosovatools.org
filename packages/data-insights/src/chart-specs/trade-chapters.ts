import {
  DEFAULT_TIME_RANGE,
  formatCurrencyCompact,
  sanitizeValue,
  type StackChartSpec,
  getPeriodGroupingOptions,
} from "@workspace/utils";
import { tradeChaptersYearly, createLabelMap } from "@workspace/kas-data";

const chapterLabelMap = createLabelMap(
  tradeChaptersYearly.meta.dimensions.chapter,
);
const periodGroupingOptions = getPeriodGroupingOptions(
  tradeChaptersYearly.meta.time.granularity,
);

export const tradeChaptersStackChartSpec: StackChartSpec<
  (typeof tradeChaptersYearly.records)[number]
> = {
  id: "kas.trade-chapters.stacked",
  datasetId: tradeChaptersYearly.meta.id,
  title: "Kapitujt kryesorë të tregtisë",
  description: "Eksportet (FOB) dhe importet (CIF) sipas kapitujve doganorë.",
  dimensionField: "chapter",
  dimensionLabel: "Kapitujt",
  dimensionLabels: chapterLabelMap,
  defaultMetricKey: "exports",
  metrics: [
    {
      key: "exports",
      label: "Eksportet (FOB)",
      formatters: {
        axis: formatCurrencyCompact,
        value: formatCurrencyCompact,
        total: formatCurrencyCompact,
      },
      getValue: (record) => sanitizeValue(record.exports, 0),
    },
    {
      key: "imports",
      label: "Importet (CIF)",
      formatters: {
        axis: formatCurrencyCompact,
        value: formatCurrencyCompact,
        total: formatCurrencyCompact,
      },
      getValue: (record) => sanitizeValue(record.imports, 0),
    },
  ],
  defaults: {
    periodGrouping: "yearly",
    timeRange: DEFAULT_TIME_RANGE,
    top: 6,
    includeOther: true,
  },
  periodGroupingOptions,
  controls: {
    allowMetricSelection: true,
    allowTopSelection: true,
    allowOtherToggle: true,
  },
};
