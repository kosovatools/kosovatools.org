import tradeChaptersMonthlyJson from "../../data/kas_trade_chapters_monthly.json" with { type: "json" };
import tradePartnersJson from "../../data/kas_trade_partners.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset } from "../utils/dataset";

import type {
  TradeChapterRecord,
  TradeMetric,
  TradePartnerRecord,
} from "../types/trade";

type TradeChaptersMonthlyMeta = DatasetMetaMonthly<
  TradeMetric,
  "chapter",
  { chaptersLabel?: Record<string, string> | undefined }
>;

export type TradeChaptersMonthlyDataset = Dataset<
  TradeChapterRecord,
  TradeChaptersMonthlyMeta
>;

const tradeChaptersMonthlyData =
  tradeChaptersMonthlyJson as TradeChaptersMonthlyDataset;

export const tradeChaptersMonthly = createDataset(tradeChaptersMonthlyData);

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
