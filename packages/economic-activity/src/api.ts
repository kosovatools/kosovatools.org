import { createDatasetFetcher } from "@workspace/dataset-api";
import { createDataset } from "@workspace/kas-data";

import type {
  CategoriesDataset,
  CategoriesDatasetView,
  CitiesDataset,
  CitiesDatasetView,
  CityCategoryYearlyDataset,
  CityCategoryYearlyDatasetView,
  MonthlyCategoryCityDataset,
  MonthlyCategoryCityDatasetView,
} from "./types";

const DATASET_PREFIX = ["mfk", "turnover"] as const;
const fetchEconomicActivity = createDatasetFetcher(DATASET_PREFIX, {
  label: "economic-activity",
});

async function fetchDataset<TDataset>(file: string): Promise<TDataset> {
  return fetchEconomicActivity<TDataset>(file);
}

export async function fetchCategoriesDataset(): Promise<CategoriesDatasetView> {
  const data = await fetchDataset<CategoriesDataset>(
    "mfk_turnover_categories_yearly.json",
  );
  return createDataset(data);
}

export async function fetchCitiesDataset(): Promise<CitiesDatasetView> {
  const data = await fetchDataset<CitiesDataset>(
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
