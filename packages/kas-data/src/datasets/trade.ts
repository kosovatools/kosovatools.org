import tradeImportsJson from "../../data/kas_imports_monthly.json" with { type: "json" };
import tradeChaptersYearlyJson from "../../data/kas_trade_chapters_yearly.json" with { type: "json" };
import importsByPartnerJson from "../../data/kas_imports_by_partner.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

type TradeImportRecord = {
  period: string;
  imports_eur: number;
};

type TradeImportsDataset = Dataset<TradeImportRecord>;
export type TradeImportsMeta = TradeImportsDataset["meta"];

const tradeImportsDataset = tradeImportsJson as TradeImportsDataset;

export const tradeImportsMeta = tradeImportsDataset.meta;

export const tradeImportsMonthly: TradeImportRecord[] =
  tradeImportsDataset.records;

export const latestTradeImport: TradeImportRecord | undefined =
  tradeImportsMonthly.at(-1);

type TradeChaptersYearlyMeta = DatasetMeta & {
  chaptersLabel: Record<string, string>;
  years?: string[];
};

export type TradeChapterYearRecord = {
  year: string;
  chapter_code: string;
  imports_eur: number;
  exports_eur: number;
};

type TradeChaptersYearlyDataset = Dataset<
  TradeChapterYearRecord,
  TradeChaptersYearlyMeta
>;

const tradeChaptersYearlyDataset =
  tradeChaptersYearlyJson as TradeChaptersYearlyDataset;

export const tradeChaptersYearlyMeta = tradeChaptersYearlyDataset.meta;

export const tradeChaptersYearly: TradeChapterYearRecord[] =
  tradeChaptersYearlyDataset.records;

export type TradePartnerRecord = {
  period: string;
  partner: string;
  imports_eur: number;
};

type ImportsByPartnerMetaShape = DatasetMeta & {
  partner_labels: Record<string, string>;
  partner_count: number;
  record_count: number;
  zero_filtered: number;
};

type TradePartnerDataset = Dataset<
  TradePartnerRecord,
  ImportsByPartnerMetaShape
>;
export type ImportsByPartnerMeta = TradePartnerDataset["meta"];

const importsByPartnerDataset = importsByPartnerJson as TradePartnerDataset;

export const importsByPartnerMeta = importsByPartnerDataset.meta;

export const tradeImportsByPartner: TradePartnerRecord[] =
  importsByPartnerDataset.records;
