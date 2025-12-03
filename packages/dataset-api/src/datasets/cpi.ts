import { createDatasetFetcher } from "../client";
import { type DatasetView } from "../dataset-helpers";
import type {
  CpiAveragePriceDataset,
  CpiDataset,
} from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });

export type {
  CpiDataset,
  CpiAveragePriceDataset,
} from "@kosovatools/data-types";
export type CpiDatasetView = DatasetView<CpiDataset>;

export async function loadCpiDataset(): Promise<CpiDataset> {
  const data = await fetchDataset<CpiDataset>("kas_cpi_monthly.json");
  return data;
}

export type CpiAveragePriceDatasetView = DatasetView<CpiAveragePriceDataset>;

export async function loadCpiAveragePricesDataset(): Promise<CpiAveragePriceDataset> {
  const data = await fetchDataset<CpiAveragePriceDataset>(
    "kas_cpi_average_prices_yearly.json",
  );
  return data;
}
