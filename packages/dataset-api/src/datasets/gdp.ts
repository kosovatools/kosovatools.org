import { createDatasetFetcher } from "../client";
import { type DatasetView } from "../dataset-helpers";
import type { GdpByActivityDataset } from "@kosovatools/data-types";

const fetchDataset = createDatasetFetcher(["kas"], { label: "kas" });



export type { GdpByActivityDataset } from "@kosovatools/data-types";
export type GdpByActivityDatasetView = DatasetView<GdpByActivityDataset>;

export async function loadGdpByActivityDataset(): Promise<GdpByActivityDataset> {
  const data = await fetchDataset<GdpByActivityDataset>(
    "kas_gdp_by_activity_quarterly.json",
  );
  return data;
}
