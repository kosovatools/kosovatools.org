import type {
  Dataset,
  DatasetMetaQuarterly,
  DimensionHierarchyNode,
} from "./dataset";

export type ConstructionCostIndexMetric = "index";

export type ConstructionCostIndexRecord = {
  period: string;
  cost_category: string;
} & Record<ConstructionCostIndexMetric, number | null>;

export type ConstructionCostIndexMetaExtras = {
  dimension_hierarchies: {
    cost_category: ReadonlyArray<DimensionHierarchyNode>;
  };
};

export type ConstructionCostIndexMeta = DatasetMetaQuarterly<
  ConstructionCostIndexMetric,
  "cost_category",
  ConstructionCostIndexMetaExtras
>;

export type ConstructionCostIndexDataset = Dataset<
  ConstructionCostIndexRecord,
  ConstructionCostIndexMeta
>;
