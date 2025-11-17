import type {
  Dataset,
  DatasetMetaMonthly,
  DatasetMetaYearly,
  DatasetView,
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
export type CategoriesDataset = Dataset<
  TurnoverCategoryRecord,
  CategoriesDatasetMeta
>;
export type CategoriesDatasetView = DatasetView<
  TurnoverCategoryRecord,
  CategoriesDatasetMeta
>;

export type TurnoverCityRecord = {
  period: string;
  city: string;
  turnover: number;
  taxpayers: number;
};

export type CitiesDatasetMeta = DatasetMetaYearly<TurnoverMetric, "city">;
export type CitiesDataset = Dataset<TurnoverCityRecord, CitiesDatasetMeta>;
export type CitiesDatasetView = DatasetView<
  TurnoverCityRecord,
  CitiesDatasetMeta
>;

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
export type CityCategoryYearlyDataset = Dataset<
  CityCategoryYearlyRecord,
  CityCategoryYearlyMeta
>;
export type CityCategoryYearlyDatasetView = DatasetView<
  CityCategoryYearlyRecord,
  CityCategoryYearlyMeta
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
export type MonthlyCategoryCityDataset = Dataset<
  MonthlyCategoryCityRecord,
  MonthlyCategoryCityMeta
>;
export type MonthlyCategoryCityDatasetView = DatasetView<
  MonthlyCategoryCityRecord,
  MonthlyCategoryCityMeta
>;
