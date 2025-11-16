export type TourismMetric = "visitors" | "nights";

export type TourismRegionRecord = {
  period: string;
  region: string;
  visitor_group: "total" | "local" | "external";
  visitors: number | null;
  nights: number | null;
};
export type TourismCountryRecord = {
  period: string;
  country: string;
  visitors: number | null;
  nights: number | null;
};
