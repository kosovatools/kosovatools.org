import { PATHS } from "./paths";

export const FUEL_SPECS = {
  gasoline: { path_key: "fuel_gasoline", label: "Gasoline" },
  diesel: { path_key: "fuel_diesel", label: "Diesel" },
  lng: { path_key: "fuel_lng", label: "LNG" },
  jet: { path_key: "fuel_jet", label: "Jet / kerosene" },
} as const satisfies Record<
  string,
  { path_key: keyof typeof PATHS; label: string }
>;

export type FuelSpec = (typeof FUEL_SPECS)[keyof typeof FUEL_SPECS];
