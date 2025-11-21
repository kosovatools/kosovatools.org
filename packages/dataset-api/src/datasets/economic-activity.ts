import { createDatasetFetcher } from "../client";
import {
  createDataset,
  type Dataset,
  type ToDatasetView,
} from "@workspace/kas-data";
import type {
  CategoriesDatasetMeta,
  CitiesDatasetMeta,
  CityCategoryYearlyMeta,
  CityCategoryYearlyRecord,
  MonthlyCategoryCityMeta,
  MonthlyCategoryCityRecord,
  TurnoverCategoryRecord,
  TurnoverCityRecord,
} from "../types/economic-activity";

const DATASET_PREFIX = ["mfk", "turnover"] as const;
const fetchEconomicActivity = createDatasetFetcher(DATASET_PREFIX, {
  label: "economic-activity",
});

async function fetchDataset<TDataset>(file: string): Promise<TDataset> {
  return fetchEconomicActivity<TDataset>(file);
}

type TurnoverCategoriesDataset = Dataset<
  TurnoverCategoryRecord,
  CategoriesDatasetMeta
>;
type TurnoverCitiesDataset = Dataset<TurnoverCityRecord, CitiesDatasetMeta>;
type CityCategoryYearlyDataset = Dataset<
  CityCategoryYearlyRecord,
  CityCategoryYearlyMeta
>;
type MonthlyCategoryCityDataset = Dataset<
  MonthlyCategoryCityRecord,
  MonthlyCategoryCityMeta
>;
export type TurnoverCategoriesDatasetView =
  ToDatasetView<TurnoverCategoriesDataset>;
export type TurnoverCitiesDatasetView = ToDatasetView<TurnoverCitiesDataset>;
export type CityCategoryYearlyDatasetView =
  ToDatasetView<CityCategoryYearlyDataset>;
export type MonthlyCategoryCityDatasetView =
  ToDatasetView<MonthlyCategoryCityDataset>;

export async function fetchCategoriesDataset(): Promise<TurnoverCategoriesDatasetView> {
  const data = await fetchDataset<TurnoverCategoriesDataset>(
    "mfk_turnover_categories_yearly.json",
  );
  return createDataset(data);
}

export async function fetchCitiesDataset(): Promise<TurnoverCitiesDatasetView> {
  const data = await fetchDataset<TurnoverCitiesDataset>(
    "mfk_turnover_cities_yearly.json",
  );
  return createDataset(data);
}

export async function fetchCityCategoryYearlyDataset(): Promise<CityCategoryYearlyDatasetView> {
  const data = await fetchDataset<CityCategoryYearlyDataset>(
    "mfk_turnover_city_category_yearly.json",
  );
  return createDataset(data);
}

export async function fetchMonthlyCityCategoryDataset(): Promise<MonthlyCategoryCityDatasetView> {
  const data = await fetchDataset<MonthlyCategoryCityDataset>(
    "mfk_turnover_city_category_monthly.json",
  );
  return createDataset(data);
}
