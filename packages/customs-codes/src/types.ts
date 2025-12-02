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
