import { createDatasetFetcher } from "../client";
import type { CustomsRecord } from "../types/customs-codes";

const DATASET_PREFIX = ["customs"] as const;
const CUSTOMS_TARRIFS_PATH = "tarrifs.json";

const fetchCustomsDataset = createDatasetFetcher(DATASET_PREFIX, {
  label: "customs-codes",
  defaultInit: { cache: "no-cache", mode: "cors" },
});

export function loadCustomsTariffs(): Promise<CustomsRecord[]> {
  return fetchCustomsDataset<CustomsRecord[]>(CUSTOMS_TARRIFS_PATH);
}
