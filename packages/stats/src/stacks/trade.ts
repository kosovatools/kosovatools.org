import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackSeriesRow,
  type StackTotal,
  type StackPeriodGrouping,
} from "../utils/stack";
import {
  tradePartnerLabelMap,
  type TradePartnerRecord,
} from "../datasets/trade";

export type PartnerStackSeries = StackSeriesRow<string>;

export type PartnerTotal = StackTotal<string>;

export type PartnerStackOptions = {
  months?: number;
  top?: number;
  includeOther?: boolean;
  selectedKeys?: string[];
  excludedKeys?: string[];
  periodGrouping?: StackPeriodGrouping;
  labelForKey?: (key: string) => string;
};

const accessors = {
  period: (record: TradePartnerRecord) => record.period,
  key: (record: TradePartnerRecord) => record.partner,
  value: (record: TradePartnerRecord) => record.imports_th_eur,
};

function buildOptions(options: PartnerStackOptions = {}) {
  return {
    months: options.months,
    top: options.top,
    includeOther: options.includeOther,
    selectedKeys: options.selectedKeys,
    excludedKeys: options.excludedKeys,
    periodGrouping: options.periodGrouping,
    labelForKey: (key: string) => tradePartnerLabelMap[key] || key,
  };
}

export function summarizePartnerTotals(
  records: TradePartnerRecord[],
  options?: number | Pick<PartnerStackOptions, "months" | "periodGrouping">,
): PartnerTotal[] {
  const normalizedOptions =
    typeof options === "number" ? { months: options } : (options ?? {});

  return summarizeStackTotals(
    records,
    accessors,
    buildOptions(normalizedOptions),
  );
}

export function buildPartnerStackSeries(
  records: TradePartnerRecord[],
  options: PartnerStackOptions = {},
): Pick<StackBuildResult<string>, "keys" | "series" | "labelMap"> {
  const result = buildStackSeries(records, accessors, buildOptions(options));
  return {
    keys: result.keys,
    series: result.series,
    labelMap: result.labelMap,
  };
}
