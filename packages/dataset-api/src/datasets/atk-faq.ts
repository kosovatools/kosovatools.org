import { createDatasetFetcher } from "../client";
import type { AtkFaqDataset } from "../types";

const DATASET_PREFIX = ["atk"] as const;

const fetchAtkFaq = createDatasetFetcher(DATASET_PREFIX, {
  label: "atk-faq",
});

export function loadAtkFaq(): Promise<AtkFaqDataset> {
  return fetchAtkFaq<AtkFaqDataset>("atk_faq.json");
}
