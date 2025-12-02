import { createDatasetApi } from "../client";
import type {
  BuildingPermitsIndex,
  BuildingPermitsYearDataset,
} from "@kosovatools/data-types";
export type { BuildingPermitsYearDataset, BuildingPermitsIndex };
const datasetApi = createDatasetApi({
  prefix: ["prishtina", "building_permits"],
});

export async function loadBuildingPermitsIndex(): Promise<BuildingPermitsIndex> {
  return datasetApi.fetchJson<BuildingPermitsIndex>("index.json");
}

export async function loadBuildingPermitsYear(
  recordsFile: string,
): Promise<BuildingPermitsYearDataset> {
  return datasetApi.fetchJson<BuildingPermitsYearDataset>(recordsFile);
}
