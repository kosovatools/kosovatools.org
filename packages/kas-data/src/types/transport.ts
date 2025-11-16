export type TransportMetric =
  | "passengers_inbound"
  | "passengers_outbound"
  | "flights";

export type TransportRecord = {
  period: string;
} & Record<TransportMetric, number | null>;
