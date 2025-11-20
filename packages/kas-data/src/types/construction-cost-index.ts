import type {
  Dataset,
  DatasetMetaQuarterly,
  DimensionHierarchyNode,
} from "./dataset";

type ConstructionCostIndexMetric = "index";

export type ConstructionCostIndexRecord = {
  period: string;
  cost_category: string;
} & Record<ConstructionCostIndexMetric, number | null>;

type ConstructionCostIndexMetaExtras = {
  dimension_hierarchies: {
    cost_category: ReadonlyArray<DimensionHierarchyNode>;
  };
};

type ConstructionCostIndexMeta = DatasetMetaQuarterly<
  ConstructionCostIndexMetric,
  "cost_category",
  ConstructionCostIndexMetaExtras
>;

export type ConstructionCostIndexDataset = Dataset<
  ConstructionCostIndexRecord,
  ConstructionCostIndexMeta
>;
