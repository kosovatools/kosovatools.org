import type {
  Dataset,
  DatasetMetaMonthly,
  DimensionHierarchyNode,
} from "./dataset";

export type CpiMetric = "index" | "change";

export type CpiRecord = {
  period: string;
  group: string;
} & Record<CpiMetric, number | null>;

export type CpiMetaExtras = {
  dimension_hierarchies: {
    group: ReadonlyArray<DimensionHierarchyNode>;
  };
};

type CpiMeta = DatasetMetaMonthly<CpiMetric, "group", CpiMetaExtras>;

export type CpiDataset = Dataset<CpiRecord, CpiMeta>;
