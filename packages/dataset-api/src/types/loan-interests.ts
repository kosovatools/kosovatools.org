import type {
  Dataset,
  DatasetMetaMonthly,
  DatasetView,
  DimensionHierarchyNode,
} from "@workspace/kas-data";

export type LoanInterestMetric = "value";

export type LoanInterestRecord = {
  period: string;
  code: string;
  value: number | null;
};

export type LoanInterestMetaExtras = {
  dimension_hierarchies: {
    code: ReadonlyArray<DimensionHierarchyNode>;
  };
};

export type LoanInterestDatasetMeta = DatasetMetaMonthly<
  LoanInterestMetric,
  "code",
  LoanInterestMetaExtras
>;

export type LoanInterestDataset = Dataset<
  LoanInterestRecord,
  LoanInterestDatasetMeta
>;

export type LoanInterestDatasetView = DatasetView<LoanInterestDataset>;
