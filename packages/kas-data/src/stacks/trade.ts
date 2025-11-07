import {
  buildStackSeries,
  summarizeStackTotals,
  type StackBuildResult,
  type StackSeriesRow,
  type StackTotal,
  type StackPeriodGrouping,
} from "@workspace/chart-utils";
import {
  type TradePartnerRecord,
  type TradeChapterYearRecord,
  importsByPartner,
  tradeChaptersYearly,
} from "../datasets/trade";
import { createLabelMap } from "../utils/meta";

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
  period: (r: TradePartnerRecord) => r.period,
  key: (r: TradePartnerRecord) => r.partner,
  value: (r: TradePartnerRecord) => r.imports ?? 0,
};
const partnerLabelMap = createLabelMap(
  importsByPartner.meta.dimensions.partner,
);

function buildOptions(options: PartnerStackOptions = {}) {
  return {
    months: options.months,
    top: options.top,
    includeOther: options.includeOther,
    selectedKeys: options.selectedKeys,
    excludedKeys: options.excludedKeys,
    periodGrouping: options.periodGrouping,
    labelForKey: (key: string) => partnerLabelMap[key] ?? key,
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
  period: (r: TradeChapterYearRecord) => r.period,
  key: (r: TradeChapterYearRecord) => r.chapter,
  value: (r: TradeChapterYearRecord) => r.exports ?? 0,
};
const importChapterAccessors = {
  period: (r: TradeChapterYearRecord) => r.period,
  key: (r: TradeChapterYearRecord) => r.chapter,
  value: (r: TradeChapterYearRecord) => r.imports ?? 0,
};
const chapterLabelMap = createLabelMap(
  tradeChaptersYearly.meta.dimensions.chapter,
);

function buildChapterOptions(options: ChapterStackOptions = {}) {
  return {
    months: options.months,
    top: options.top,
    includeOther: options.includeOther,
    selectedKeys: options.selectedKeys,
    excludedKeys: options.excludedKeys,
    periodGrouping: options.periodGrouping,
    labelForKey: (key: string) => chapterLabelMap[key] ?? key,
  };
}

export function summarizeExportChapterTotals(
  records: TradeChapterYearRecord[],
  options?: number | Pick<ChapterStackOptions, "months" | "periodGrouping">,
): ChapterTotal[] {
  const normalized =
    typeof options === "number" ? { months: options } : (options ?? {});
  return summarizeStackTotals(
    records,
    exportChapterAccessors,
    buildChapterOptions(normalized),
  );
}

export function summarizeImportChapterTotals(
  records: TradeChapterYearRecord[],
  options?: number | Pick<ChapterStackOptions, "months" | "periodGrouping">,
): ChapterTotal[] {
  const normalized =
    typeof options === "number" ? { months: options } : (options ?? {});
  return summarizeStackTotals(
    records,
    importChapterAccessors,
    buildChapterOptions(normalized),
  );
}

export function buildExportChapterStackSeries(
  records: TradeChapterYearRecord[],
  options: ChapterStackOptions = {},
): Pick<StackBuildResult<string>, "keys" | "series" | "labelMap"> {
  const result = buildStackSeries(
    records,
    exportChapterAccessors,
    buildChapterOptions(options),
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
    buildChapterOptions(options),
  );
  return {
    keys: result.keys,
    series: result.series,
    labelMap: result.labelMap,
  };
}
