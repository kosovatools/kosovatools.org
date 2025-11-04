import regionData from "../../data/kas_tourism_region_monthly.json" with { type: "json" };
import countryData from "../../data/kas_tourism_country_monthly.json" with { type: "json" };
import type { Dataset, DatasetMeta } from "../types/dataset";

export type TourismRegionRecord = {
  period: string;
  region: string;
  visitor_group: "total" | "local" | "external";
  visitor_group_label: string;
  visitors: number | null;
  nights: number | null;
};

export type TourismCountryRecord = {
  period: string;
  country: string;
  visitors: number | null;
  nights: number | null;
};

export type TourismRegionMeta = DatasetMeta & {
  regions?: string[];
  visitor_groups?: string[];
  metrics?: string[];
};

export type TourismCountryMeta = DatasetMeta & {
  countries?: string[];
  metrics?: string[];
};

type TourismRegionDataset = Dataset<TourismRegionRecord, TourismRegionMeta>;
type TourismCountryDataset = Dataset<TourismCountryRecord, TourismCountryMeta>;

const tourismRegionDataset = regionData as TourismRegionDataset;
const tourismCountryDataset = countryData as TourismCountryDataset;

export const tourismRegionMeta = tourismRegionDataset.meta;
export const tourismCountryMeta = tourismCountryDataset.meta;

export const tourismByRegion: TourismRegionRecord[] =
  tourismRegionDataset.records.slice();

const AGGREGATE_COUNTRY_LABELS = new Set(["external"]);

export const tourismByCountry: TourismCountryRecord[] =
  tourismCountryDataset.records
    .slice()
    .filter(
      ({ country }) => !AGGREGATE_COUNTRY_LABELS.has(country.toLowerCase()),
    );
