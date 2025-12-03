import { createDatasetFetcher } from "../client";
import type {
  AirTransportDataset,
  VehicleTypesDataset,
} from "@kosovatools/data-types";
import { DatasetView } from "../dataset-helpers";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });



export type {
  AirTransportDataset,
  VehicleTypesDataset,
} from "@kosovatools/data-types";
export type AirTransportDatasetView = DatasetView<AirTransportDataset>;

export async function loadAirTransportDataset(): Promise<AirTransportDataset> {
  const data = await fetchDataset<AirTransportDataset>(
    "kas_transport_air_traffic_monthly.json",
  );
  return data;
}

export type VehicleTypesDatasetView = DatasetView<VehicleTypesDataset>;

export async function loadVehicleTypesDataset(): Promise<VehicleTypesDataset> {
  const data = await fetchDataset<VehicleTypesDataset>(
    "kas_transport_vehicle_types_yearly.json",
  );
  return data;
}
