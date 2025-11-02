import sourcesJson from "../../data/kas_sources.json" with { type: "json" };

export type KasSources = {
  generated_at: string;
  api_bases_tried: string[];
  sources: Record<string, unknown>;
};

export const kasSources = sourcesJson as KasSources;
