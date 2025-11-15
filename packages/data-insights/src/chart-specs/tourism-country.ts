import {
  DEFAULT_TIME_RANGE,
  formatCount,
  sanitizeValue,
  type StackChartSpec,
  getPeriodGroupingOptions,
} from "@workspace/utils";
import {
  tourismCountry,
  type TourismCountryRecord,
  createLabelMap,
} from "@workspace/kas-data";

const countryLabelMap = createLabelMap(tourismCountry.meta.dimensions.country);
const periodGroupingOptions = getPeriodGroupingOptions(
  tourismCountry.meta.time.granularity,
);

export const tourismCountryStackChartSpec: StackChartSpec<TourismCountryRecord> =
  {
    id: "kas.tourism-country.stacked",
    datasetId: tourismCountry.meta.id,
    title: "Vendet kryesore të vizitorëve",
    description:
      "Origjina e vizitorëve ose netëve të qëndrimit për periudhën e zgjedhur.",
    dimensionField: "country",
    dimensionLabel: "Vendet",
    dimensionLabels: countryLabelMap,
    defaultMetricKey: "visitors",
    metrics: [
      {
        key: "visitors",
        label: "Vizitorët",
        formatters: {
          axis: formatCount,
          value: formatCount,
          total: formatCount,
        },
        getValue: (record) => sanitizeValue(record.visitors, 0),
      },
      {
        key: "nights",
        label: "Netët e qëndrimit",
        formatters: {
          axis: formatCount,
          value: formatCount,
          total: formatCount,
        },
        getValue: (record) => sanitizeValue(record.nights, 0),
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
      allowMetricSelection: true,
      allowPeriodGrouping: true,
      allowTimeRange: true,
      allowTopSelection: true,
      allowOtherToggle: true,
    },
  };
