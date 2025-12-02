import { createDatasetFetcher } from "../client";
import {
  type Dataset,
  type DatasetMetaMonthly,
  type DatasetMetaYearly,
  type DatasetView,
} from "../dataset-helpers";
import type {
  TransportMetric,
  TransportRecord,
  VehicleTypesMetric,
  VehicleTypesRecord,
} from "@kosovatools/data-types/transport";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

// Air transport (monthly)
export type AirTransportMeta = DatasetMetaMonthly<TransportMetric>;
export type AirTransportDataset = Dataset<TransportRecord, AirTransportMeta>;
export type AirTransportDatasetView = DatasetView<AirTransportDataset>;

export async function loadAirTransportDataset(): Promise<AirTransportDataset> {
  const data = await fetchDataset<AirTransportDataset>(
    "kas_transport_air_traffic_monthly.json",
  );
  return data;
}

// Vehicle types (yearly)
export type VehicleTypesMeta = DatasetMetaYearly<
  VehicleTypesMetric,
  "vehicle_type"
>;
export type VehicleTypesDataset = Dataset<VehicleTypesRecord, VehicleTypesMeta>;
export type VehicleTypesDatasetView = DatasetView<VehicleTypesDataset>;

export async function loadVehicleTypesDataset(): Promise<VehicleTypesDataset> {
  const data = await fetchDataset<VehicleTypesDataset>(
    "kas_transport_vehicle_types_yearly.json",
  );
  return data;
}
