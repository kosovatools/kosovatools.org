import {
  DEFAULT_TIME_RANGE,
  formatCurrencyCompact,
  sanitizeValue,
  type StackChartSpec,
  getPeriodGroupingOptions,
} from "@workspace/utils";
import {
  importsByPartner,
  type TradePartnerRecord,
  createLabelMap,
} from "@workspace/kas-data";

const partnerLabelMap = createLabelMap(
  importsByPartner.meta.dimensions.partner,
);
const periodGroupingOptions = getPeriodGroupingOptions(
  importsByPartner.meta.time.granularity,
);

export const importPartnersStackChartSpec: StackChartSpec<TradePartnerRecord> =
  {
    id: "kas.import-partners.stacked",
    datasetId: importsByPartner.meta.id,
    title: "Partnerët kryesorë të importit (shtresuar)",
    description:
      "Partnerët tregtarë me kontributin më të madh në importet mujore të Kosovës.",
    dimensionField: "partner",
    dimensionLabel: "Partnerët",
    dimensionLabels: partnerLabelMap,
    defaultMetricKey: "imports",
    metrics: [
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
      top: 5,
      includeOther: true,
    },
    periodGroupingOptions,
    controls: {
      allowPeriodGrouping: true,
      allowTimeRange: true,
      allowTopSelection: true,
      allowOtherToggle: true,
    },
  };
