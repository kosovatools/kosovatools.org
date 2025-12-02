import { createDatasetFetcher } from "../client";
import {
  type Dataset,
  type DatasetMetaMonthly,
  type DatasetView,
} from "../dataset-helpers";
import type {
  TradeChapterRecord,
  TradeMetric,
  TradePartnerRecord,
} from "@kosovatools/data-types/trade";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

// Trade chapters (monthly)
export type TradeChaptersMeta = DatasetMetaMonthly<
  TradeMetric,
  "chapter",
  { chaptersLabel?: Record<string, string> }
>;
export type TradeChaptersDataset = Dataset<
  TradeChapterRecord,
  TradeChaptersMeta
>;
export type TradeChaptersDatasetView = DatasetView<TradeChaptersDataset>;

export async function loadTradeChaptersDataset(): Promise<TradeChaptersDataset> {
  const data = await fetchDataset<TradeChaptersDataset>(
    "kas_trade_chapters_monthly.json",
  );
  return data;
}

// Trade partners (monthly)
export type TradePartnersMeta = DatasetMetaMonthly<
  TradeMetric,
  "partner",
  { partner_labels?: Record<string, string> }
>;
export type TradePartnersDataset = Dataset<
  TradePartnerRecord,
  TradePartnersMeta
>;
export type TradePartnersDatasetView = DatasetView<TradePartnersDataset>;

export async function loadTradePartnersDataset(): Promise<TradePartnersDataset> {
  const data = await fetchDataset<TradePartnersDataset>(
    "kas_trade_partners.json",
  );
  return data;
}
