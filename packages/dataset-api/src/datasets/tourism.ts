import { createDatasetFetcher } from "../client";
import { type DatasetView } from "../dataset-helpers";
import type {
  TourismCountryDataset,
  TourismRegionDataset,
} from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });



export type {
  TourismCountryDataset,
  TourismRegionDataset,
} from "@kosovatools/data-types";
export type TourismRegionDatasetView = DatasetView<TourismRegionDataset>;

export async function loadTourismRegionDataset(): Promise<TourismRegionDataset> {
  const data = await fetchDataset<TourismRegionDataset>(
    "kas_tourism_region_monthly.json",
  );
  return data;
}

export type TourismCountryDatasetView = DatasetView<TourismCountryDataset>;

export async function loadTourismCountryDataset(): Promise<TourismCountryDataset> {
  const data = await fetchDataset<TourismCountryDataset>(
    "kas_tourism_country_monthly.json",
  );
  return data;
}
