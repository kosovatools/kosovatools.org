import regionJson from "../../data/kas_tourism_region_monthly.json" with { type: "json" };
import countryJson from "../../data/kas_tourism_country_monthly.json" with { type: "json" };
import type { Dataset, DatasetMetaMonthly } from "../types/dataset";
import { createDataset, DatasetView } from "../utils/dataset";

import type {
  TourismCountryRecord,
  TourismMetric,
  TourismRegionRecord,
} from "../types/tourism";

type TourismRegionMeta = DatasetMetaMonthly<
  TourismMetric,
  "region" | "visitor_group"
>;
type TourismRegionDataset = Dataset<TourismRegionRecord, TourismRegionMeta>;
const tourismRegionData = regionJson as TourismRegionDataset;
export type TourismRegionDatasetView = DatasetView<TourismRegionDataset>;
export const tourismRegion = createDataset(tourismRegionData);

type TourismCountryMeta = DatasetMetaMonthly<TourismMetric, "country">;
type TourismCountryDataset = Dataset<TourismCountryRecord, TourismCountryMeta>;
const tourismCountryData = countryJson as TourismCountryDataset;
export type TourismCountryDatasetView = DatasetView<TourismCountryDataset>;
export const tourismCountry = createDataset(tourismCountryData);
