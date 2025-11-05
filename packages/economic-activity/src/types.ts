export type TurnoverCategoryRecord = {
  category: string;
  turnover: number;
  taxpayers: number;
};

export type TurnoverCityRecord = {
  city: string;
  turnover: number;
  taxpayers: number;
};

export type CategoriesLastYear = {
  year: number;
  records: TurnoverCategoryRecord[];
};

export type CitiesLastYear = {
  year: number;
  records: TurnoverCityRecord[];
};

export type MonthlyCategoryCityRecord = {
  month: number;
  category: string;
  city: string;
  turnover: number;
  taxpayers: number;
};

export type MonthlyCategoryCityLastYear = {
  year: number;
  records: MonthlyCategoryCityRecord[];
};

export type CategoryOverYearsRecord = {
  year: number;
  category: string;
  turnover: number;
  taxpayers: number;
};

export type TopCategoriesByCityRecord = {
  year: number;
  city: string;
  category: string;
  turnover: number;
  taxpayers: number;
  rank: number;
};
