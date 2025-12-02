import { createDatasetFetcher } from "../client";
import type { MemorialVictim, VictimChunk } from "@kosovatools/data-types";
export type { MemorialVictim, VictimChunk };
const DATASET_PREFIX = ["war"] as const;
const CHUNK_FILE_PREFIX = "deaths-part";

const fetchWarDataset = createDatasetFetcher(DATASET_PREFIX, {
  defaultInit: { cache: "no-store" },
  label: "war-records",
});

function buildChunkFilename(page: number): string {
  const suffix = page.toString().padStart(2, "0");
  return `${CHUNK_FILE_PREFIX}-${suffix}.json`;
}

export async function fetchWarVictimChunk(page: number): Promise<VictimChunk> {
  return fetchWarDataset<VictimChunk>(buildChunkFilename(page));
}
