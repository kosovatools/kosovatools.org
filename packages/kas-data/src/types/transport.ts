export type TransportMetric =
  | "passengers_inbound"
  | "passengers_outbound"
  | "flights";

export type TransportRecord = {
  period: string;
} & Record<TransportMetric, number | null>;

export type VehicleTypesMetric = "vehicles";

export type VehicleTypesRecord = {
  period: string;
  vehicle_type: string;
  vehicles: number | null;
};
