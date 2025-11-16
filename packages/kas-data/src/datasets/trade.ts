import tradeChaptersYearlyJson from "../../data/kas_trade_chapters_yearly.json" with { type: "json" };
import importsByPartnerJson from "../../data/kas_imports_by_partner.json" with { type: "json" };
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

export type TradeChaptersYearlyMeta = DatasetMetaYearly<
  TradeMetric,
  "chapter",
  { chaptersLabel?: Record<string, string> | undefined }
>;

type TradeChaptersYearlyDataset = Dataset<
  TradeChapterRecord,
  TradeChaptersYearlyMeta
>;

const tradeChaptersYearlyData =
  tradeChaptersYearlyJson as TradeChaptersYearlyDataset;

export const tradeChaptersYearly = createDataset(tradeChaptersYearlyData);

export type ImportsByPartnerMeta = DatasetMetaMonthly<
  "imports",
  "partner",
  { partner_labels?: Record<string, string> | undefined }
>;

type TradePartnerDataset = Dataset<TradePartnerRecord, ImportsByPartnerMeta>;

const importsByPartnerData = importsByPartnerJson as TradePartnerDataset;

export const importsByPartner = createDataset(importsByPartnerData);
