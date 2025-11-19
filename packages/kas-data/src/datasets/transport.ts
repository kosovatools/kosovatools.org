import transportJson from "../../data/kas_transport_air_traffic_monthly.json" with { type: "json" };
import vehicleTypesJson from "../../data/kas_transport_vehicle_types_yearly.json" with { type: "json" };
import type {
  Dataset,
  DatasetMetaMonthly,
  DatasetMetaYearly,
} from "../types/dataset";
import { createDataset } from "../utils/dataset";

import type {
  TransportMetric as AirTransportMetric,
  TransportRecord as AirTransportRecord,
  VehicleTypesMetric,
  VehicleTypesRecord,
} from "../types/transport";

type AirTransportMeta = DatasetMetaMonthly<AirTransportMetric>;

export type AirTransportDataset = Dataset<AirTransportRecord, AirTransportMeta>;
const airTransportData = transportJson as AirTransportDataset;

export const airTransportMonthly = createDataset(airTransportData);

type VehicleTypesMeta = DatasetMetaYearly<VehicleTypesMetric, "vehicle_type">;

export type VehicleTypesDataset = Dataset<VehicleTypesRecord, VehicleTypesMeta>;

const vehicleTypesData = vehicleTypesJson as VehicleTypesDataset;

export const vehicleTypesYearly = createDataset(vehicleTypesData);
