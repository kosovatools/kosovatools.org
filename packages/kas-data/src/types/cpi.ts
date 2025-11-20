import type { DimensionHierarchyNode } from "./dataset";

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

export type CpiAveragePriceRecord = {
  period: string;
  article: string;
  price: number | null;
};
