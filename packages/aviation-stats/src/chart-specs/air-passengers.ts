import {
  DEFAULT_TIME_RANGE,
  formatCount,
  sanitizeValue,
  type StackChartSpec,
  getPeriodGroupingOptions,
  limitTimeRangeOptions,
} from "@workspace/utils";
import { airTransportMonthly } from "@workspace/kas-data";

export type PassengerStackRecord = {
  period: string;
  direction: "inbound" | "outbound";
  passengers: number | null;
};

const dimensionLabels: Readonly<
  Record<PassengerStackRecord["direction"], string>
> = {
  inbound: "Pasagjerë hyrës",
  outbound: "Pasagjerë dalës",
};

const periodGroupingOptions = getPeriodGroupingOptions(
  airTransportMonthly.meta.time.granularity,
);
const timeRangeOptions = limitTimeRangeOptions(
  airTransportMonthly.meta.time.count,
);

export const airPassengerStackChartSpec: StackChartSpec<PassengerStackRecord> =
  {
    id: "aviation.passengers.stacked",
    datasetId: airTransportMonthly.meta.id,
    title: "Pasagjerë hyrës/dalës",
    description:
      "Numri i pasagjerëve hyrës dhe dalës sipas periudhës së zgjedhur.",
    dimensionField: "direction",
    dimensionLabel: "Fluksi i pasagjerëve",
    dimensionLabels,
    defaultMetricKey: "passengers",
    metrics: [
      {
        key: "passengers",
        label: "Pasagjerë",
        formatters: {
          axis: formatCount,
          value: formatCount,
          total: formatCount,
        },
        getValue: (record) => sanitizeValue(record.passengers, 0),
      },
    ],
    defaults: {
      periodGrouping: "monthly",
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
