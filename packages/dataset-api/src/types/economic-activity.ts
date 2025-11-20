import type {
  DatasetMetaMonthly,
  DatasetMetaYearly,
} from "@workspace/kas-data";

export type TurnoverMetric = "turnover" | "taxpayers";

export type TurnoverCategoryRecord = {
  period: string;
  category: string;
  turnover: number;
  taxpayers: number;
};

export type CategoriesDatasetMeta = DatasetMetaYearly<
  TurnoverMetric,
  "category"
>;

export type TurnoverCityRecord = {
  period: string;
  city: string;
  turnover: number;
  taxpayers: number;
};

export type CitiesDatasetMeta = DatasetMetaYearly<TurnoverMetric, "city">;

export type CityCategoryYearlyRecord = {
  period: string;
  city: string;
  category: string;
  turnover: number;
  taxpayers: number;
  rank: number;
};

export type CityCategoryYearlyMeta = DatasetMetaYearly<
  TurnoverMetric,
  "city" | "category"
>;

export type MonthlyCategoryCityRecord = {
  period: string;
  city: string;
  category: string;
  turnover: number;
  taxpayers: number;
};

export type MonthlyCategoryCityMeta = DatasetMetaMonthly<
  TurnoverMetric,
  "city" | "category",
  { coverage_year: number }
>;
