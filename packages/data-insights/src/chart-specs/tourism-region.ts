import {
  DEFAULT_TIME_RANGE,
  formatCount,
  sanitizeValue,
  type StackChartSpec,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
} from "@workspace/utils";
import {
  tourismRegion,
  type TourismRegionRecord,
  createLabelMap,
} from "@workspace/kas-data";

const regionLabelMap = createLabelMap(tourismRegion.meta.dimensions.region);
const periodGroupingOptions = getPeriodGroupingOptions(
  tourismRegion.meta.time.granularity,
);
const timeRangeOptions = limitTimeRangeOptions(tourismRegion.meta.time.count);

export const tourismRegionStackChartSpec: StackChartSpec<TourismRegionRecord> =
  {
    id: "kas.tourism-region.stacked",
    datasetId: tourismRegion.meta.id,
    title: "Turizmi sipas rajonit",
    description:
      "Vizitorët sipas rajoneve të Kosovës dhe grupit të vizitorëve.",
    dimensionField: "region",
    dimensionLabel: "Rajonet",
    dimensionLabels: regionLabelMap,
    defaultMetricKey: "visitors",
    metrics: [
      {
        key: "visitors",
        label: "Vizitorët",
        formatters: {
          axis: formatCount,
          value: formatCount,
          total: formatCount,
          summary: formatCount,
        },
        getValue: (record) => sanitizeValue(record.visitors, 0),
      },
    ],
    defaults: {
      periodGrouping: "yearly",
      timeRange: DEFAULT_TIME_RANGE,
      includeOther: false,
    },
    periodGroupingOptions,
    timeRangeOptions,
    controls: {
      allowPeriodGrouping: true,
      allowTimeRange: true,
    },
  };
