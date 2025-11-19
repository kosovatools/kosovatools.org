import tradeChaptersYearlyJson from "../../data/kas_trade_chapters_yearly.json" with { type: "json" };
import tradePartnersJson from "../../data/kas_trade_partners.json" with { type: "json" };
import type {
  Dataset,
  DatasetMetaMonthly,
  DatasetMetaYearly,
} from "../types/dataset";
import { createDataset } from "../utils/dataset";

import type {
  TradeChapterRecord,
  TradeMetric,
  TradePartnerRecord,
} from "../types/trade";

type TradeChaptersYearlyMeta = DatasetMetaYearly<
  TradeMetric,
  "chapter",
  { chaptersLabel?: Record<string, string> | undefined }
>;

export type TradeChaptersYearlyDataset = Dataset<
  TradeChapterRecord,
  TradeChaptersYearlyMeta
>;

const tradeChaptersYearlyData =
  tradeChaptersYearlyJson as TradeChaptersYearlyDataset;

export const tradeChaptersYearly = createDataset(tradeChaptersYearlyData);

type TradePartnersMeta = DatasetMetaMonthly<
  TradeMetric,
  "partner",
  { partner_labels?: Record<string, string> | undefined }
>;

export type TradePartnersDataset = Dataset<
  TradePartnerRecord,
  TradePartnersMeta
>;

const tradePartnersData = tradePartnersJson as TradePartnersDataset;

export const tradePartners = createDataset(tradePartnersData);
