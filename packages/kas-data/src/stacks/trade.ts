import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackSeriesRow,
  type StackTotal,
  type StackPeriodGrouping,
} from "@workspace/chart-utils";
import {
  tradePartnerLabelMap,
  tradeChapterLabelMap,
  type TradePartnerRecord,
  type TradeChapterYearRecord,
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

export type ChapterStackSeries = StackSeriesRow<string>;

export type ChapterTotal = StackTotal<string>;

export type ChapterStackOptions = PartnerStackOptions;

const exportChapterAccessors = {
  period: (record: TradeChapterYearRecord) => record.year,
  key: (record: TradeChapterYearRecord) => record.chapter_code,
  value: (record: TradeChapterYearRecord) => record.exports_eur,
};

const importChapterAccessors = {
  period: (record: TradeChapterYearRecord) => record.year,
  key: (record: TradeChapterYearRecord) => record.chapter_code,
  value: (record: TradeChapterYearRecord) => record.imports_eur,
};

function buildChapterOptions(
  labelMap: Record<string, string>,
  options: ChapterStackOptions = {},
) {
  return {
    months: options.months,
    top: options.top,
    includeOther: options.includeOther,
    selectedKeys: options.selectedKeys,
    excludedKeys: options.excludedKeys,
    periodGrouping: options.periodGrouping,
    labelForKey: (key: string) => labelMap[key] || key,
  };
}

export function summarizeExportChapterTotals(
  records: TradeChapterYearRecord[],
  options?: number | Pick<ChapterStackOptions, "months" | "periodGrouping">,
): ChapterTotal[] {
  const normalizedOptions =
    typeof options === "number" ? { months: options } : (options ?? {});
  return summarizeStackTotals(
    records,
    exportChapterAccessors,
    buildChapterOptions(tradeChapterLabelMap, normalizedOptions),
  );
}

export function summarizeImportChapterTotals(
  records: TradeChapterYearRecord[],
  options?: number | Pick<ChapterStackOptions, "months" | "periodGrouping">,
): ChapterTotal[] {
  const normalizedOptions =
    typeof options === "number" ? { months: options } : (options ?? {});
  return summarizeStackTotals(
    records,
    importChapterAccessors,
    buildChapterOptions(tradeChapterLabelMap, normalizedOptions),
  );
}

export function buildExportChapterStackSeries(
  records: TradeChapterYearRecord[],
  options: ChapterStackOptions = {},
): Pick<StackBuildResult<string>, "keys" | "series" | "labelMap"> {
  const result = buildStackSeries(
    records,
    exportChapterAccessors,
    buildChapterOptions(tradeChapterLabelMap, options),
  );
  return {
    keys: result.keys,
    series: result.series,
    labelMap: result.labelMap,
  };
}

export function buildImportChapterStackSeries(
  records: TradeChapterYearRecord[],
  options: ChapterStackOptions = {},
): Pick<StackBuildResult<string>, "keys" | "series" | "labelMap"> {
  const result = buildStackSeries(
    records,
    importChapterAccessors,
    buildChapterOptions(tradeChapterLabelMap, options),
  );
  return {
    keys: result.keys,
    series: result.series,
    labelMap: result.labelMap,
  };
}
