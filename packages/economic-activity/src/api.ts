import { createDatasetApi } from "@workspace/dataset-api";
import type {
  CategoriesLastYear,
  CategoryOverYearsRecord,
  CitiesLastYear,
  MonthlyCategoryCityLastYear,
  TopCategoriesByCityRecord,
} from "./types";

const economicActivityDataset = createDatasetApi({
  prefix: "mfk/turnover",
});

function sortByTurnoverDesc<T extends { turnover: number }>(
  a: T,
  b: T,
): number {
  return b.turnover - a.turnover;
}

function sortByMonthAsc(a: { month: number }, b: { month: number }): number {
  return a.month - b.month;
}

function sortByYearThenCategory(
  a: CategoryOverYearsRecord,
  b: CategoryOverYearsRecord,
): number {
  return a.year === b.year
    ? a.category.localeCompare(b.category)
    : a.year - b.year;
}

function sortByYearThenCity(
  a: TopCategoriesByCityRecord,
  b: TopCategoriesByCityRecord,
): number {
  return a.year === b.year ? a.city.localeCompare(b.city) : a.year - b.year;
}

export async function fetchCategoriesLastYear(): Promise<CategoriesLastYear> {
  const dataset = await economicActivityDataset.fetchJson<CategoriesLastYear>(
    "categories_last_year.json",
  );

  return {
    ...dataset,
    records: [...dataset.records].sort(sortByTurnoverDesc),
  };
}

export async function fetchMonthlyCategoryCityLastYear(): Promise<MonthlyCategoryCityLastYear> {
  const dataset =
    await economicActivityDataset.fetchJson<MonthlyCategoryCityLastYear>(
      "monthly_category_city_last_year.json",
    );

  return {
    ...dataset,
    records: [...dataset.records].sort(sortByMonthAsc),
  };
}

export async function fetchCategoriesOverYears(): Promise<
  CategoryOverYearsRecord[]
> {
  const records = await economicActivityDataset.fetchJson<
    CategoryOverYearsRecord[]
  >("categories_over_years.json");

  return [...records].sort(sortByYearThenCategory);
}

export async function fetchTopCategoryByCityOverYears(): Promise<
  TopCategoriesByCityRecord[]
> {
  const records = await economicActivityDataset.fetchJson<
    TopCategoriesByCityRecord[]
  >("top_category_by_city_over_years.json");

  return [...records].sort(sortByYearThenCity);
}

export async function fetchCitiesLastYear(): Promise<CitiesLastYear> {
  const dataset = await economicActivityDataset.fetchJson<CitiesLastYear>(
    "cities_last_year.json",
  );

  return {
    ...dataset,
    records: [...dataset.records].sort(sortByTurnoverDesc),
  };
}
