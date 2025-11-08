import { createDatasetApi } from "@workspace/dataset-api";

import type {
  BuildingPermitsIndex,
  BuildingPermitsYearDataset,
} from "./types";

const datasetApi = createDatasetApi({ prefix: ["prishtina", "building_permits"] });

export async function loadBuildingPermitsIndex() {
  return datasetApi.fetchJson<BuildingPermitsIndex>("index.json");
}

export async function loadBuildingPermitsYear(
  recordsFile: string,
) {
  return datasetApi.fetchJson<BuildingPermitsYearDataset>(recordsFile);
}
