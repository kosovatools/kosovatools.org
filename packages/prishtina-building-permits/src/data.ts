import { createDatasetApi, loadDataset } from "@kosovatools/data";
import type {
  BuildingPermitsIndex,
  BuildingPermitsYearDataset,
} from "@kosovatools/data";

const datasetApi = createDatasetApi({
  prefix: ["prishtina", "building_permits"],
});

export async function loadBuildingPermitsIndex(): Promise<BuildingPermitsIndex> {
  return loadDataset("prishtina.building-permits-index");
}

export async function loadBuildingPermitsYear(
  recordsFile: string,
): Promise<BuildingPermitsYearDataset> {
  return datasetApi.fetchJson<BuildingPermitsYearDataset>(recordsFile);
}
