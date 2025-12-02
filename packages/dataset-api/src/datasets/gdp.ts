import { createDatasetFetcher } from "../client";
import { type Dataset, type DatasetView } from "../dataset-helpers";
import type {
  GdpByActivityMeta,
  GdpByActivityRecord,
} from "@kosovatools/data-types/gdp";

const fetchKasDataset = createDatasetFetcher(["kas"], { label: "kas" });

async function fetchDataset<T>(file: string): Promise<T> {
  return fetchKasDataset<T>(file);
}

export type GdpByActivityDataset = Dataset<
  GdpByActivityRecord,
  GdpByActivityMeta
>;
export type GdpByActivityDatasetView = DatasetView<GdpByActivityDataset>;

export async function loadGdpByActivityDataset(): Promise<GdpByActivityDataset> {
  const data = await fetchDataset<GdpByActivityDataset>(
    "kas_gdp_by_activity_quarterly.json",
  );
  return data;
}
