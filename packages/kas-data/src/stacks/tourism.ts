import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackSeriesRow,
  type StackTotal,
  type StackPeriodGrouping,
} from "@workspace/utils";
import {
  tourismCountry,
  tourismRegion,
  type TourismCountryRecord,
  type TourismRegionRecord,
  type TourismMetric,
} from "../datasets/tourism";
import { createLabelMap } from "../utils/meta";

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
    period: (r: TourismCountryRecord) => r.period,
    key: (r: TourismCountryRecord) => r.country,
    value: (r: TourismCountryRecord) => r[metric] ?? 0,
  };
}

const countryLabelMap = createLabelMap(tourismCountry.meta.dimensions.country);

function buildOptions(options: CountryStackOptions = {}) {
  return {
    months: options.months,
    top: options.top,
    includeOther: options.includeOther,
    selectedKeys: options.selectedKeys,
    excludedKeys: options.excludedKeys,
    periodGrouping: options.periodGrouping,
    labelForKey: (key: string) => countryLabelMap[key] ?? key,
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
  period: (r: TourismRegionRecord) => r.period,
  key: (r: TourismRegionRecord) => r.region,
  value: (r: TourismRegionRecord) => r.visitors ?? 0,
};
const regionLabelMap = createLabelMap(tourismRegion.meta.dimensions.region);

function buildRegionOptions(options: RegionStackOptions = {}) {
  return {
    months: options.months,
    periodGrouping: options.periodGrouping,
    labelForKey: (key: string) => regionLabelMap[key] ?? key,
  };
}

const DEFAULT_REGION_GROUP: RegionVisitorGroup = "total";

export function buildRegionStackSeries(
  records: TourismRegionRecord[],
  options: RegionStackOptions = {},
): Pick<StackBuildResult<string>, "keys" | "series" | "labelMap"> {
  const group = options.group ?? DEFAULT_REGION_GROUP;
  const filtered = records.filter((r) =>
    group ? r.visitor_group === group : true,
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
