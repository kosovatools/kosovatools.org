import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackSeriesRow,
  type StackTotal,
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
    labelForKey: (key: string) => tradePartnerLabelMap[key] || key,
  };
}

export function summarizePartnerTotals(
  records: TradePartnerRecord[],
  months = 12,
): PartnerTotal[] {
  return summarizeStackTotals(records, accessors, buildOptions({ months }));
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
