import regionData from "../../data/kas_tourism_region_monthly.json" with { type: "json" };
import countryData from "../../data/kas_tourism_country_monthly.json" with { type: "json" };

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

export const tourismByRegion: TourismRegionRecord[] = (
  regionData as TourismRegionRecord[]
).slice(0);

const AGGREGATE_COUNTRY_LABELS = new Set(["external"]);

export const tourismByCountry: TourismCountryRecord[] = (
  countryData as TourismCountryRecord[]
)
  .slice(0)
  .filter(
    ({ country }) => !AGGREGATE_COUNTRY_LABELS.has(country.toLowerCase()),
  );
