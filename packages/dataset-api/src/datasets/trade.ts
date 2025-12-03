import { createDatasetFetcher } from "../client";
import { type DatasetView } from "../dataset-helpers";
import type {
  TradeChaptersDataset,
  TradePartnersDataset,
} from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });

export type {
  TradeChaptersDataset,
  TradePartnersDataset,
} from "@kosovatools/data-types";
export type TradeChaptersDatasetView = DatasetView<TradeChaptersDataset>;

export async function loadTradeChaptersDataset(): Promise<TradeChaptersDataset> {
  const data = await fetchDataset<TradeChaptersDataset>(
    "kas_trade_chapters_monthly.json",
  );
  return data;
}

export type TradePartnersDatasetView = DatasetView<TradePartnersDataset>;

export async function loadTradePartnersDataset(): Promise<TradePartnersDataset> {
  const data = await fetchDataset<TradePartnersDataset>(
    "kas_trade_partners.json",
  );
  return data;
}
