import type {
  Dataset,
  DatasetMetaYearly,
  KqzRecountDiffDataset,
} from "@kosovatools/data";

export type KqzRecountDeltaRecord = {
  period: string;
  municipality_id: string;
  municipality_name: string | null;
  voting_station_id: string;
  voting_station_name: string | null;
  polling_station_id: string;
  polling_station_name: string | null;
  party_id: string;
  party_name: string | null;
  candidate_id: string;
  candidate_name: string | null;
  level: "party" | "candidate";
  delta: number;
};

type KqzRecountMeta = DatasetMetaYearly<
  "delta",
  "level" | "party_id" | "candidate_id" | "municipality_id",
  {
    vote_type: string;
    recount_polling_station_count: number;
    missing_in_qkn: string[];
  }
>;

export type KqzRecountDeltaDataset = Dataset<KqzRecountDeltaRecord, KqzRecountMeta>;

const FALLBACK_PERIOD = String(new Date().getFullYear());

export function buildKqzRecountDeltaDataset(
  diff: KqzRecountDiffDataset,
): KqzRecountDeltaDataset {
  const period = FALLBACK_PERIOD;
  const records: KqzRecountDeltaRecord[] = [];
  const municipalityOptions = new Map<string, string>();
  const partyOptions = new Map<string, string>();
  const candidateOptions = new Map<string, string>();

  Object.values(diff.polling_station_diffs).forEach((station) => {
    const base = {
      period,
      municipality_id: station.municipality_id,
      municipality_name: station.municipality_name ?? null,
      voting_station_id: station.voting_station_id,
      voting_station_name: station.voting_station_name ?? null,
      polling_station_id: station.polling_station_id,
      polling_station_name: station.polling_station_name ?? null,
    };
    if (!municipalityOptions.has(station.municipality_id)) {
      municipalityOptions.set(
        station.municipality_id,
        station.municipality_name ?? station.municipality_id,
      );
    }

    Object.entries(station.party_deltas).forEach(([party_id, partyDelta]) => {
      const partyName = diff.party_lookup?.[party_id]?.name ?? null;
      if (!partyOptions.has(party_id)) {
        partyOptions.set(party_id, partyName ?? party_id);
      }
      if (partyDelta.total_votes_delta !== 0) {
        records.push({
          ...base,
          party_id,
          party_name: partyName,
          candidate_id: "total",
          candidate_name: null,
          level: "party",
          delta: partyDelta.total_votes_delta,
        });
      }

      Object.entries(partyDelta.candidate_deltas).forEach(
        ([candidate_id, delta]) => {
          if (delta === 0) return;
          const candidateName =
            diff.candidate_lookup?.[party_id]?.[candidate_id]?.name ?? null;
          if (!candidateOptions.has(candidate_id)) {
            candidateOptions.set(candidate_id, candidateName ?? candidate_id);
          }
          records.push({
            ...base,
            party_id,
            party_name: partyName,
            candidate_id,
            candidate_name: candidateName,
            level: "candidate",
            delta,
          });
        },
      );
    });
  });
  if (!candidateOptions.has("total")) {
    candidateOptions.set("total", "Total");
  }

  return {
    meta: {
      id: "kqz.parliamentary-recount-diff",
      generated_at: new Date().toISOString(),
      updated_at: null,
      time: {
        key: "period",
        granularity: "yearly",
        first: period,
        last: period,
        count: 1,
      },
      fields: [
        {
          key: "delta",
          label: "Ndryshimi i votave",
          unit: "vota",
        },
      ],
      metrics: ["delta"],
      dimensions: {
        level: [
          { key: "party", label: "Parti" },
          { key: "candidate", label: "Kandidat" },
        ],
        party_id: Array.from(partyOptions, ([key, label]) => ({ key, label })),
        candidate_id: Array.from(candidateOptions, ([key, label]) => ({
          key,
          label,
        })),
        municipality_id: Array.from(municipalityOptions, ([key, label]) => ({
          key,
          label,
        })),
      },
      source: "Komisioni Qendror i Zgjedhjeve",
      source_urls: [
        "https://storage.kqz-ks.org/parliamentary-qkn-latest.json",
        "https://storage.kqz-ks.org/parliamentary-qnr-latest.json",
      ],
      title: "Diferencat mes numërimit fillestar dhe rinumërimit",
      notes: [
        "Të dhënat pasqyrojnë vetëm vendvotimet e rinumëruara (vote_type=1).",
        "Shenjat negative tregojnë rënie nga numërimi fillestar.",
      ],
      vote_type: diff.vote_type,
      recount_polling_station_count: diff.recount_polling_station_count,
      missing_in_qkn: diff.missing_in_qkn,
    },
    records,
  };
}
