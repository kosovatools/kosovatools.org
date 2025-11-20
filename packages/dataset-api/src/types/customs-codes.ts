export interface CustomsRecord {
  code: string;
  description: string;
  percentage: number;
  cefta: number;
  msa: number;
  trmtl: number;
  tvsh: number;
  excise: number;
  validFrom: string;
  uomCode: string | null;
  rootCode?: string | null;
  highlightedDescription?: string | null;
  fileUrl?: string | null;
  importMeasure?: string | null;
  exportMeasure?: string | null;
}

export type CustomsFlatRow = CustomsRecord;

export type CustomsTreeNode = CustomsFlatRow & {
  subRows: CustomsTreeNode[];
};

export type InitializationPhase =
  | "load-data"
  | "indexing"
  | "done"
  | "cached"
  | "error";

export type InitializationProgress = {
  phase: InitializationPhase;
  loaded: number;
  total: number;
  message: string;
};
