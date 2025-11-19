export type DatasetMetaField<TKey extends string> = Readonly<{
  key: TKey;
  label: string;
  unit: string; // REQUIRED per v1.1
}>;

export type DimensionOption<TKey extends string> = Readonly<{
  key: TKey;
  label: string;
}>;

export type DimensionHierarchyNode = Readonly<{
  key: string;
  label: string;
  short_label: string;
  parent: string | null;
  children: ReadonlyArray<string>;
  level: number;
}>;

export type TimeGranularity = "yearly" | "quarterly" | "monthly" | "daily";

export type DatasetMetaBaseExtras = Record<never, never>;

export type DatasetMeta<
  TFieldKey extends string,
  TDimensionKey extends string,
  TGranularity extends TimeGranularity,
  TExtras extends object,
> = Readonly<{
  id: string;
  generated_at: string;
  updated_at: string | null;
  time: Readonly<{
    key: "period";
    granularity: TGranularity;
    first: string;
    last: string;
    count: number;
  }>;
  fields: ReadonlyArray<DatasetMetaField<TFieldKey>>;
  metrics: ReadonlyArray<TFieldKey>;
  dimensions: { [K in TDimensionKey]: ReadonlyArray<DimensionOption<string>> };
  source: string;
  source_urls: string[];
  title?: string | null;
  notes?: string[];
}> &
  Readonly<TExtras>;

// Convenience helpers for common cases
export type DatasetMetaMonthly<
  TFieldKey extends string,
  TDimensionKey extends string = never,
  TExtras extends object = DatasetMetaBaseExtras,
> = DatasetMeta<TFieldKey, TDimensionKey, "monthly", TExtras>;

export type DatasetMetaQuarterly<
  TFieldKey extends string,
  TDimensionKey extends string = never,
  TExtras extends object = DatasetMetaBaseExtras,
> = DatasetMeta<TFieldKey, TDimensionKey, "quarterly", TExtras>;

export type DatasetMetaYearly<
  TFieldKey extends string,
  TDimensionKey extends string = never,
  TExtras extends object = DatasetMetaBaseExtras,
> = DatasetMeta<TFieldKey, TDimensionKey, "yearly", TExtras>;

export type Dataset<
  TRecord,
  TMeta extends DatasetMeta<string, string, TimeGranularity, object>,
> = Readonly<{ meta: TMeta; records: ReadonlyArray<TRecord> }>;
