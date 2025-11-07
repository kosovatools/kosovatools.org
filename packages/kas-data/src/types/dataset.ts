export type DatasetMetaField<TKey extends string = string> = Readonly<{
  key: TKey;
  label: string;
  unit: string; // REQUIRED per v1.1
}>;

export type DimensionOption<TKey extends string = string> = Readonly<{
  key: TKey;
  label: string;
}>;

export type TimeGranularity =
  | "yearly"
  | "quarterly"
  | "monthly"
  | "weekly"
  | "daily";

export type DatasetMeta<
  TFieldKey extends string = string,
  TDimensionKey extends string = never,
  TExtras extends Record<string, unknown> = Record<never, never>,
> = Readonly<{
  id: string;
  generated_at: string;
  updated_at: string | null;
  time: Readonly<{
    key: "period";
    granularity: TimeGranularity;
    first: string;
    last: string;
    count: number;
  }>;
  fields: ReadonlyArray<DatasetMetaField<TFieldKey>>;
  metrics: ReadonlyArray<TFieldKey>;
  dimensions: { [K in TDimensionKey]: ReadonlyArray<DimensionOption<string>> };
  unit?: string | null;
  source: string;
  source_urls: string[];
  title?: string | null;
  notes?: string[];
}> &
  Readonly<TExtras>;

export type Dataset<
  TRecord,
  TMeta extends DatasetMeta = DatasetMeta,
> = Readonly<{ meta: TMeta; records: ReadonlyArray<TRecord> }>;
