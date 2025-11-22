import cpiMonthlyJson from "../../data/kas_cpi_monthly.json" with { type: "json" };
import cpiAveragePricesJson from "../../data/kas_cpi_average_prices_yearly.json" with { type: "json" };
import { createDataset, DatasetView } from "../utils/dataset";
import type {
  CpiAveragePriceRecord,
  CpiMetaExtras,
  CpiMetric,
  CpiRecord,
} from "../types/cpi";
import {
  Dataset,
  DatasetMetaMonthly,
  DatasetMetaYearly,
} from "../types/dataset";

type CpiMeta = DatasetMetaMonthly<CpiMetric, "group", CpiMetaExtras>;

type CpiDataset = Dataset<CpiRecord, CpiMeta>;
const cpiDatasetData = cpiMonthlyJson as CpiDataset;
export type CpiDatasetView = DatasetView<CpiDataset>;
export const cpiDataset = createDataset(cpiDatasetData);

export type CpiAveragePriceDataset = Dataset<
  CpiAveragePriceRecord,
  DatasetMetaYearly<"price", "article">
>;
const cpiAveragePricesData = cpiAveragePricesJson as CpiAveragePriceDataset;
export type CpiAveragePriceDatasetView = DatasetView<CpiAveragePriceDataset>;
export const cpiAveragePricesYearly = createDataset(cpiAveragePricesData);
