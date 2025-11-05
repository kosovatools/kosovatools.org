import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackSeriesRow,
  type StackTotal,
  type StackPeriodGrouping,
} from "@workspace/chart-utils";
import {
  fuelKeys,
  fuelLabels,
  type FuelBalanceRecord,
  type FuelKey,
  type FuelMetric,
} from "../datasets/fuels";

type FuelStackRecord = {
  period: string;
  fuel: FuelKey;
  value: number;
};

export type FuelTypeStackSeries = StackSeriesRow<FuelKey>;

export type FuelTotal = StackTotal<FuelKey>;

export type FuelTypeStackOptions = {
  months?: number;
  metric?: FuelMetric;
  includeOther?: boolean;
  selectedKeys?: FuelKey[];
  periodGrouping?: StackPeriodGrouping;
};

const DEFAULT_METRIC: FuelMetric = "ready_for_market";

function toStackRecords(
  balances: Record<FuelKey, FuelBalanceRecord[]>,
  metric: FuelMetric,
): FuelStackRecord[] {
  const rows: FuelStackRecord[] = [];
  for (const key of fuelKeys) {
    for (const entry of balances[key] ?? []) {
      rows.push({
        period: entry.period,
        fuel: key,
        value: entry[metric] ?? 0,
      });
    }
  }
  return rows;
}

function accessors() {
  return {
    period: (record: FuelStackRecord) => record.period,
    key: (record: FuelStackRecord) => record.fuel,
    value: (record: FuelStackRecord) => record.value,
  };
}

function buildOptions(options: FuelTypeStackOptions = {}, selected: FuelKey[]) {
  return {
    months: options.months,
    includeOther:
      options.includeOther && selected.length < fuelKeys.length ? true : false,
    selectedKeys: selected,
    allowedKeys: fuelKeys,
    labelForKey: (key: FuelKey) => fuelLabels[key],
    periodGrouping: options.periodGrouping,
  };
}

export function summarizeFuelTotals(
  balances: Record<FuelKey, FuelBalanceRecord[]>,
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
    labelForKey: (key: FuelKey) => fuelLabels[key],
    periodGrouping,
  });
}

export function buildFuelTypeStackSeries(
  balances: Record<FuelKey, FuelBalanceRecord[]>,
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
