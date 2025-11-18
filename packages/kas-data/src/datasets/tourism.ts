import regionJson from "../../data/kas_tourism_region_monthly.json" with { type: "json" };
import countryJson from "../../data/kas_tourism_country_monthly.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset } from "../utils/dataset";

import type {
  TourismCountryRecord,
  TourismMetric,
  TourismRegionRecord,
} from "../types/tourism";

type TourismRegionMeta = DatasetMetaMonthly<
  TourismMetric,
  "region" | "visitor_group"
>;

type TourismCountryMeta = DatasetMetaMonthly<TourismMetric, "country">;

export type TourismRegionDataset = Dataset<
  TourismRegionRecord,
  TourismRegionMeta
>;
export type TourismCountryDataset = Dataset<
  TourismCountryRecord,
  TourismCountryMeta
>;

const tourismRegionData = regionJson as TourismRegionDataset;
const tourismCountryData = countryJson as TourismCountryDataset;

export const tourismRegion = createDataset(tourismRegionData);
export const tourismCountry = createDataset(tourismCountryData);
