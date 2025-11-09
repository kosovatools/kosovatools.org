import { createDatasetFetcher } from "@workspace/dataset-api";
import type {
  CategoriesLastYear,
  CategoryOverYearsRecord,
  CitiesLastYear,
  MonthlyCategoryCityLastYear,
  TopCategoriesByCityRecord,
} from "./types";

const DATASET_PREFIX = ["mfk", "turnover"] as const;
const fetchEconomicActivity = createDatasetFetcher(DATASET_PREFIX, {
  label: "economic-activity",
});

export function fetchCategoriesLastYear(): Promise<CategoriesLastYear> {
  return fetchEconomicActivity<CategoriesLastYear>("categories_last_year.json");
}

export function fetchMonthlyCategoryCityLastYear(): Promise<MonthlyCategoryCityLastYear> {
  return fetchEconomicActivity<MonthlyCategoryCityLastYear>(
    "monthly_category_city_last_year.json",
  );
}

export function fetchCategoriesOverYears(): Promise<CategoryOverYearsRecord[]> {
  return fetchEconomicActivity<CategoryOverYearsRecord[]>(
    "categories_over_years.json",
  );
}

export function fetchTopCategoryByCityOverYears(): Promise<
  TopCategoriesByCityRecord[]
> {
  return fetchEconomicActivity<TopCategoriesByCityRecord[]>(
    "top_category_by_city_over_years.json",
  );
}

export function fetchCitiesLastYear(): Promise<CitiesLastYear> {
  return fetchEconomicActivity<CitiesLastYear>("cities_last_year.json");
}
