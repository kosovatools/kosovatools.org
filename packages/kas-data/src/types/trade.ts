export type TradeMetric = "imports" | "exports";

export type TradeChapterRecord = {
  period: string;
  chapter: string;
  imports: number | null;
  exports: number | null;
};

export type TradePartnerRecord = {
  period: string;
  partner: string;
  imports: number | null;
  exports: number | null;
};
