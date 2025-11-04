export type DatasetMetaField = {
  key: string;
  label: string;
  unit?: string | null;
};

export type DatasetMeta = {
  table: string;
  path: string;
  generated_at: string;
  updated_at: string | null;
  unit?: string | null;
  fields: DatasetMetaField[];
  periods?: number;
  [key: string]: unknown;
};

export type Dataset<TRecord, TMeta extends DatasetMeta = DatasetMeta> = {
  meta: TMeta;
  records: TRecord[];
};
