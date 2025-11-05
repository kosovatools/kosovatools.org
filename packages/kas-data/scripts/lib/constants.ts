export const API_BASE = "https://askdata.rks-gov.net/api/v1/sq";

export const PATHS = {
  trade_monthly: [
    "ASKdata",
    "External trade",
    "Monthly indicators",
    "08_qarkullimi.px",
  ],
  trade_chapters_yearly: [
    "ASKdata",
    "External trade",
    "Yearly indicators",
    "tab03.px",
  ],
  energy_monthly: ["ASKdata", "Energy", "Monthly indicators", "tab01.px"],
  imports_by_partner: [
    "ASKdata",
    "External trade",
    "Monthly indicators",
    "07_imp_country.px",
  ],
  fuel_gasoline: ["ASKdata", "Energy", "Monthly indicators", "tab03.px"],
  fuel_diesel: ["ASKdata", "Energy", "Monthly indicators", "tab04.px"],
  fuel_lng: ["ASKdata", "Energy", "Monthly indicators", "tab05.px"],
  fuel_jet: ["ASKdata", "Energy", "Monthly indicators", "tab06.px"],
  tourism_region: [
    "ASKdata",
    "Tourism and hotels",
    "Treguesit mujorë",
    "tab01.px",
  ],
  tourism_country: [
    "ASKdata",
    "Tourism and hotels",
    "Treguesit mujorë",
    "tab02.px",
  ],
  cpi_change: [
    "ASKdata",
    "Prices",
    "Consumer Price Index",
    "Monthly indicators",
    "cpi05.px",
  ],
  cpi_index: [
    "ASKdata",
    "Prices",
    "Consumer Price Index",
    "Monthly indicators",
    "cpi09.px",
  ],
} as const satisfies Record<string, readonly string[]>;

export type PxPathKey = keyof typeof PATHS;

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

export const USER_AGENT = "kas-pxweb-fetch/1.1 (kosovatools.org)";
