import transportJson from "../../data/kas_transport_air_traffic_monthly.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset } from "../utils/dataset";

import type {
  TransportMetric as AirTransportMetric,
  TransportRecord as AirTransportRecord,
} from "../types/transport";

export type AirTransportMeta = DatasetMetaMonthly<AirTransportMetric>;

export type AirTransportDataset = Dataset<AirTransportRecord, AirTransportMeta>;
const airTransportData = transportJson as AirTransportDataset;

export const airTransportMonthly = createDataset(airTransportData);
