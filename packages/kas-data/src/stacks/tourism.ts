import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackSeriesRow,
  type StackTotal,
  type StackPeriodGrouping,
} from "@workspace/chart-utils";
import {
  tourismCountryMeta,
  tourismRegionMeta,
  type TourismCountryRecord,
  type TourismRegionRecord,
  type TourismMetric,
} from "../datasets/tourism";

export type CountryStackSeries = StackSeriesRow<string>;

export type CountryTotal = StackTotal<string>;

export type CountryStackOptions = {
  months?: number;
  top?: number;
  includeOther?: boolean;
  metric?: TourismMetric;
  selectedKeys?: string[];
  excludedKeys?: string[];
  periodGrouping?: StackPeriodGrouping;
};

function accessorsForMetric(metric: TourismMetric) {
  return {
    period: (record: TourismCountryRecord) => record.period,
    key: (record: TourismCountryRecord) => record.country,
    value: (record: TourismCountryRecord) => record[metric],
  };
}

function buildOptions(options: CountryStackOptions = {}) {
  const countryLabels = tourismCountryMeta.country_labels;
  return {
    months: options.months,
    top: options.top,
    includeOther: options.includeOther,
    selectedKeys: options.selectedKeys,
    excludedKeys: options.excludedKeys,
    periodGrouping: options.periodGrouping,
    labelForKey: (key: string) => countryLabels[key] || key,
  };
}

const DEFAULT_METRIC: TourismMetric = "visitors";

export function summarizeCountryTotals(
  records: TourismCountryRecord[],
  {
    months,
    metric = DEFAULT_METRIC,
    periodGrouping,
  }: Pick<CountryStackOptions, "months" | "metric" | "periodGrouping"> = {},
): CountryTotal[] {
  return summarizeStackTotals(
    records,
    accessorsForMetric(metric),
    buildOptions({ months, periodGrouping }),
  );
}

export function buildCountryStackSeries(
  records: TourismCountryRecord[],
  { metric = DEFAULT_METRIC, ...options }: CountryStackOptions = {},
): Pick<StackBuildResult<string>, "keys" | "series" | "labelMap"> {
  const result = buildStackSeries(
    records,
    accessorsForMetric(metric),
    buildOptions(options),
  );
  return {
    keys: result.keys,
    series: result.series,
    labelMap: result.labelMap,
  };
}

export type RegionVisitorGroup = TourismRegionRecord["visitor_group"];

export type RegionStackSeries = StackSeriesRow<string>;

export type RegionStackOptions = {
  months?: number;
  group?: RegionVisitorGroup;
  periodGrouping?: StackPeriodGrouping;
};

const regionAccessors = {
  period: (record: TourismRegionRecord) => record.period,
  key: (record: TourismRegionRecord) => record.region,
  value: (record: TourismRegionRecord) => record.visitors,
};

function buildRegionOptions(options: RegionStackOptions = {}) {
  const regionLabels = tourismRegionMeta.region_labels;
  return {
    months: options.months,
    periodGrouping: options.periodGrouping,
    labelForKey: (key: string) => regionLabels[key] || key,
  };
}

const DEFAULT_REGION_GROUP: RegionVisitorGroup = "total";

export function buildRegionStackSeries(
  records: TourismRegionRecord[],
  options: RegionStackOptions = {},
): Pick<StackBuildResult<string>, "keys" | "series" | "labelMap"> {
  const group = options.group ?? DEFAULT_REGION_GROUP;
  const filtered = records.filter((record) =>
    group ? record.visitor_group === group : true,
  );

  const result = buildStackSeries(
    filtered,
    regionAccessors,
    buildRegionOptions(options),
  );

  return {
    keys: result.keys,
    series: result.series,
    labelMap: result.labelMap,
  };
}
