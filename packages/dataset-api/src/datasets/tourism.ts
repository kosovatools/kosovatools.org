import { createDatasetFetcher } from "../client";
import {
  type Dataset,
  type DatasetMetaMonthly,
  type DatasetView,
} from "../dataset-helpers";
import type {
  TourismCountryRecord,
  TourismMetric,
  TourismRegionRecord,
} from "@kosovatools/data-types/tourism";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

// Tourism by region (monthly)
export type TourismRegionMeta = DatasetMetaMonthly<
  TourismMetric,
  "region" | "visitor_group"
>;
export type TourismRegionDataset = Dataset<
  TourismRegionRecord,
  TourismRegionMeta
>;
export type TourismRegionDatasetView = DatasetView<TourismRegionDataset>;

export async function loadTourismRegionDataset(): Promise<TourismRegionDataset> {
  const data = await fetchDataset<TourismRegionDataset>(
    "kas_tourism_region_monthly.json",
  );
  return data;
}

// Tourism by country (monthly)
export type TourismCountryMeta = DatasetMetaMonthly<TourismMetric, "country">;
export type TourismCountryDataset = Dataset<
  TourismCountryRecord,
  TourismCountryMeta
>;
export type TourismCountryDatasetView = DatasetView<TourismCountryDataset>;

export async function loadTourismCountryDataset(): Promise<TourismCountryDataset> {
  const data = await fetchDataset<TourismCountryDataset>(
    "kas_tourism_country_monthly.json",
  );
  return data;
}
