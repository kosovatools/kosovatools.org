import tradeImportsJson from "../../data/kas_imports_monthly.json" with { type: "json" };
import tradeChaptersYearlyJson from "../../data/kas_trade_chapters_yearly.json" with { type: "json" };
import importsByPartnerJson from "../../data/kas_imports_by_partner.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

type TradeImportRecord = { period: string; imports: number | null };

type TradeImportMetric = "imports";
export type TradeImportsMeta = DatasetMeta<TradeImportMetric>;
type TradeImportsDataset = Dataset<TradeImportRecord, TradeImportsMeta>;

const tradeImportsDataset = tradeImportsJson as TradeImportsDataset;
export const tradeImportsMeta = tradeImportsDataset.meta;
export const tradeImportsMonthly: TradeImportRecord[] = [
  ...tradeImportsDataset.records,
];
export const latestTradeImport: TradeImportRecord | undefined =
  tradeImportsMonthly.at(-1);

export type TradeChapterYearRecord = {
  period: string;
  chapter: string;
  imports: number | null;
  exports: number | null;
};

type TradeChapterMetric = "imports" | "exports";
type TradeChapterDimension = "chapter";
type TradeChaptersYearlyMeta = DatasetMeta<
  TradeChapterMetric,
  TradeChapterDimension,
  { chaptersLabel?: Record<string, string> | undefined }
>;

type TradeChaptersYearlyDataset = Dataset<
  TradeChapterYearRecord,
  TradeChaptersYearlyMeta
>;

export const tradeChaptersYearly =
  tradeChaptersYearlyJson as TradeChaptersYearlyDataset;

export type TradePartnerRecord = {
  period: string;
  partner: string;
  imports: number | null;
};

type TradePartnerMetric = "imports";
type TradePartnerDimension = "partner";
type ImportsByPartnerMetaShape = DatasetMeta<
  TradePartnerMetric,
  TradePartnerDimension,
  { partner_labels?: Record<string, string> | undefined }
>;

type TradePartnerDataset = Dataset<
  TradePartnerRecord,
  ImportsByPartnerMetaShape
>;
export type ImportsByPartnerMeta = TradePartnerDataset["meta"];

export const importsByPartner = importsByPartnerJson as TradePartnerDataset;
