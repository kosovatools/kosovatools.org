import regionJson from "../../data/kas_tourism_region_monthly.json" with { type: "json" };
import countryJson from "../../data/kas_tourism_country_monthly.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset } from "../utils/dataset";

import type {
  TourismCountryRecord,
  TourismMetric,
  TourismRegionRecord,
} from "../types/tourism";

export type TourismRegionMeta = DatasetMetaMonthly<
  TourismMetric,
  "region" | "visitor_group"
>;

export type TourismCountryMeta = DatasetMetaMonthly<TourismMetric, "country">;

type RegionDataset = Dataset<TourismRegionRecord, TourismRegionMeta>;
type CountryDataset = Dataset<TourismCountryRecord, TourismCountryMeta>;

const tourismRegionData = regionJson as RegionDataset;
const tourismCountryData = countryJson as CountryDataset;

export const tourismRegion = createDataset(tourismRegionData);
export const tourismCountry = createDataset(tourismCountryData);
