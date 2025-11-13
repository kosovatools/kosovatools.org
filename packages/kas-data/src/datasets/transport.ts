import transportJson from "../../data/kas_transport_air_traffic_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

export type AirTransportMetric =
  | "passengers_inbound"
  | "passengers_outbound"
  | "flights";

export type AirTransportRecord = {
  period: string;
  passengers_inbound: number | null;
  passengers_outbound: number | null;
  flights: number | null;
};

export type AirTransportMeta = DatasetMeta<AirTransportMetric>;

export type AirTransportDataset = Dataset<AirTransportRecord, AirTransportMeta>;

export const airTransportMonthly = transportJson as AirTransportDataset;
