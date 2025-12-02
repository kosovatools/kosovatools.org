import { createDatasetFetcher } from "../client";
import {
  type Dataset,
  type DatasetMetaMonthly,
  type DatasetMetaYearly,
  type DatasetView,
} from "../dataset-helpers";
import type {
  CpiAveragePriceRecord,
  CpiMetaExtras,
  CpiMetric,
  CpiRecord,
} from "@kosovatools/data-types/cpi";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

export type CpiMeta = DatasetMetaMonthly<CpiMetric, "group", CpiMetaExtras>;
export type CpiDataset = Dataset<CpiRecord, CpiMeta>;
export type CpiDatasetView = DatasetView<CpiDataset>;

export async function loadCpiDataset(): Promise<CpiDataset> {
  const data = await fetchDataset<CpiDataset>("kas_cpi_monthly.json");
  return data;
}

export type CpiAveragePriceDataset = Dataset<
  CpiAveragePriceRecord,
  DatasetMetaYearly<"price", "article">
>;
export type CpiAveragePriceDatasetView = DatasetView<CpiAveragePriceDataset>;

export async function loadCpiAveragePricesDataset(): Promise<CpiAveragePriceDataset> {
  const data = await fetchDataset<CpiAveragePriceDataset>(
    "kas_cpi_average_prices_yearly.json",
  );
  return data;
}
