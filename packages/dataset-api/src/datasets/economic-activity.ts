import { createDatasetFetcher } from "../client";
import { type Dataset, type DatasetView } from "../dataset-helpers";
import type {
  CategoriesDatasetMeta,
  CitiesDatasetMeta,
  CityCategoryYearlyMeta,
  CityCategoryYearlyRecord,
  MonthlyCategoryCityMeta,
  MonthlyCategoryCityRecord,
  TurnoverCategoryRecord,
  TurnoverCityRecord,
} from "@kosovatools/data-types";

const DATASET_PREFIX = ["mfk", "turnover"] as const;
const fetchEconomicActivity = createDatasetFetcher(DATASET_PREFIX, {
  label: "economic-activity",
});

async function fetchDataset<TDataset>(file: string): Promise<TDataset> {
  return fetchEconomicActivity<TDataset>(file);
}

export type TurnoverCategoriesDataset = Dataset<
  TurnoverCategoryRecord,
  CategoriesDatasetMeta
>;
export type TurnoverCitiesDataset = Dataset<
  TurnoverCityRecord,
  CitiesDatasetMeta
>;
export type CityCategoryYearlyDataset = Dataset<
  CityCategoryYearlyRecord,
  CityCategoryYearlyMeta
>;
export type MonthlyCategoryCityDataset = Dataset<
  MonthlyCategoryCityRecord,
  MonthlyCategoryCityMeta
>;
export type TurnoverCategoriesDatasetView =
  DatasetView<TurnoverCategoriesDataset>;
export type TurnoverCitiesDatasetView = DatasetView<TurnoverCitiesDataset>;
export type CityCategoryYearlyDatasetView =
  DatasetView<CityCategoryYearlyDataset>;
export type MonthlyCategoryCityDatasetView =
  DatasetView<MonthlyCategoryCityDataset>;

export async function fetchCategoriesDataset(): Promise<TurnoverCategoriesDataset> {
  const data = await fetchDataset<TurnoverCategoriesDataset>(
    "mfk_turnover_categories_yearly.json",
  );
  return data;
}

export async function fetchCitiesDataset(): Promise<TurnoverCitiesDataset> {
  const data = await fetchDataset<TurnoverCitiesDataset>(
    "mfk_turnover_cities_yearly.json",
  );
  return data;
}

export async function fetchCityCategoryYearlyDataset(): Promise<CityCategoryYearlyDataset> {
  const data = await fetchDataset<CityCategoryYearlyDataset>(
    "mfk_turnover_city_category_yearly.json",
  );
  return data;
}

export async function fetchMonthlyCityCategoryDataset(): Promise<MonthlyCategoryCityDataset> {
  const data = await fetchDataset<MonthlyCategoryCityDataset>(
    "mfk_turnover_city_category_monthly.json",
  );
  return data;
}
