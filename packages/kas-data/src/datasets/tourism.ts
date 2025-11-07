import regionJson from "../../data/kas_tourism_region_monthly.json" with { type: "json" };
import countryJson from "../../data/kas_tourism_country_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

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

export type TourismRegionMeta = DatasetMeta<
  TourismMetric,
  "region" | "visitor_group"
>;
export type TourismCountryMeta = DatasetMeta<TourismMetric, "country">;

type RegionDataset = Dataset<TourismRegionRecord, TourismRegionMeta>;
type CountryDataset = Dataset<TourismCountryRecord, TourismCountryMeta>;

export const tourismRegion = regionJson as RegionDataset;
export const tourismCountry = countryJson as CountryDataset;
