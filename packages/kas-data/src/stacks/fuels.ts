import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackSeriesRow,
  type StackTotal,
  type PeriodGrouping,
} from "@workspace/utils";
import {
  fuelDataset,
  type FuelBalanceRecord,
  type FuelKey,
  type FuelMetric,
} from "../datasets/fuels";
import { createLabelMap } from "../utils/meta";

type FuelStackRecord = { period: string; fuel: FuelKey; value: number };
const fuelLabelMap = createLabelMap(fuelDataset.meta.dimensions.fuel);
const fuelKeys = Object.keys(fuelLabelMap) as FuelKey[];
export type FuelTypeStackSeries = StackSeriesRow<FuelKey>;
export type FuelTotal = StackTotal<FuelKey>;

export type FuelTypeStackOptions = {
  months?: number;
  metric?: FuelMetric;
  includeOther?: boolean;
  selectedKeys?: FuelKey[];
  periodGrouping?: PeriodGrouping;
};

const DEFAULT_METRIC: FuelMetric = "ready_for_market";

function toStackRecords(
  balances: FuelBalanceRecord[],
  metric: FuelMetric,
): FuelStackRecord[] {
  return balances.map((e) => ({
    period: e.period,
    fuel: e.fuel,
    value:
      typeof e[metric] === "number" && Number.isFinite(e[metric])
        ? e[metric]
        : 0,
  }));
}

function accessors() {
  return {
    period: (r: FuelStackRecord) => r.period,
    key: (r: FuelStackRecord) => r.fuel,
    value: (r: FuelStackRecord) => r.value,
  };
}

function labelForFuel(key: FuelKey): string {
  return fuelLabelMap[key] ?? key;
}

function buildOptions(options: FuelTypeStackOptions = {}, selected: FuelKey[]) {
  return {
    months: options.months,
    includeOther:
      options.includeOther &&
      selected.length < fuelDataset.meta.dimensions.fuel.length
        ? true
        : false,
    selectedKeys: selected,
    allowedKeys: fuelKeys,
    labelForKey: labelForFuel,
    periodGrouping: options.periodGrouping,
  };
}

export function summarizeFuelTotals(
  balances: FuelBalanceRecord[],
  {
    months,
    metric = DEFAULT_METRIC,
    periodGrouping,
  }: Pick<FuelTypeStackOptions, "months" | "metric" | "periodGrouping"> = {},
): FuelTotal[] {
  const records = toStackRecords(balances, metric);
  return summarizeStackTotals(records, accessors(), {
    months,
    allowedKeys: fuelKeys,
    labelForKey: labelForFuel,
    periodGrouping,
  });
}

export function buildFuelTypeStackSeries(
  balances: FuelBalanceRecord[],
  {
    metric = DEFAULT_METRIC,
    selectedKeys,
    ...options
  }: FuelTypeStackOptions = {},
): Pick<StackBuildResult<FuelKey>, "keys" | "series" | "labelMap"> {
  const records = toStackRecords(balances, metric);
  const selected =
    selectedKeys && selectedKeys.length ? selectedKeys : fuelKeys;
  const result = buildStackSeries(
    records,
    accessors(),
    buildOptions({ ...options, metric }, selected),
  );
  return {
    keys: result.keys,
    series: result.series,
    labelMap: result.labelMap,
  };
}
