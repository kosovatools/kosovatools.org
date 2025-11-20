import gdpByActivityQuarterlyJson from "../../data/kas_gdp_by_activity_quarterly.json" with { type: "json" };
import type { Dataset } from "../types/dataset";
import type { GdpByActivityMeta, GdpByActivityRecord } from "../types/gdp";
import { createDataset, ToDatasetView } from "../utils/dataset";

type GdpByActivityDataset = Dataset<GdpByActivityRecord, GdpByActivityMeta>;

const gdpByActivityQuarterlyData =
  gdpByActivityQuarterlyJson as GdpByActivityDataset;

export type GdpByActivityDatasetView = ToDatasetView<GdpByActivityDataset>;

export const gdpByActivityQuarterly = createDataset(gdpByActivityQuarterlyData);
