import type { DatasetMetaQuarterly, DimensionHierarchyNode } from "./dataset";

export type GovernmentFinanceMetric = "amount_eur";

export type GovernmentRevenueRecord = {
  period: string;
  category: string;
  amount_eur: number | null;
};

export type GovernmentExpenditureRecord = {
  period: string;
  category: string;
  amount_eur: number | null;
};

export type GovernmentRevenueMeta = DatasetMetaQuarterly<
  GovernmentFinanceMetric,
  "category",
  {
    dimension_hierarchies?: {
      category: ReadonlyArray<DimensionHierarchyNode>;
    };
  }
>;

export type GovernmentExpenditureMeta = DatasetMetaQuarterly<
  GovernmentFinanceMetric,
  "category"
>;
