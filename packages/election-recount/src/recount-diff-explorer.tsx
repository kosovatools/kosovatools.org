"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";
import { Input } from "@workspace/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { OptionSelector } from "@workspace/ui/custom-components/option-selector";
import { loadDataset } from "@kosovatools/data";
import { formatCount, type DatasetView } from "@workspace/utils";
import { buildKqzRecountDeltaDataset } from "./kqz-recount";

type KqzRecountDeltaDataset = ReturnType<typeof buildKqzRecountDeltaDataset>;
type KqzRecountDeltaView = DatasetView<KqzRecountDeltaDataset>;
type KqzRecountDeltaRecord = KqzRecountDeltaView["records"][number];

type FilterState = {
  search: string;
  granularity: "national" | "municipality" | "voting-station";
  sort: "delta" | "candidate";
  direction: "all" | "positive" | "negative";
  municipality: string;
  party: string;
};

const DEFAULT_FILTERS: FilterState = {
  search: "",
  granularity: "national",
  sort: "delta",
  direction: "all",
  municipality: "all",
  party: "all",
};

const formatDelta = (value: number) =>
  `${value > 0 ? "+" : ""}${formatCount(value)}`;

const getGranularityBucket = (
  record: KqzRecountDeltaRecord,
  granularity: FilterState["granularity"],
) => {
  if (granularity === "national") return "national";
  if (granularity === "municipality") return record.municipality_id;
  return `${record.municipality_id}::${record.voting_station_id}`;
};

const withGranularityLabels = (
  record: KqzRecountDeltaRecord,
  granularity: FilterState["granularity"],
) => {
  const next = { ...record };
  if (granularity === "national") {
    next.municipality_id = "0";
    next.municipality_name = "Kombëtare";
    next.voting_station_id = "all";
    next.voting_station_name = "Të gjitha qendrat e votimit";
    next.polling_station_id = "all";
    next.polling_station_name = "Të gjitha vendvotimet";
  } else if (granularity === "municipality") {
    next.voting_station_id = "all";
    next.voting_station_name = "Të gjitha qendrat e votimit";
    next.polling_station_id = "all";
    next.polling_station_name = "Të gjitha vendvotimet";
  } else {
    next.polling_station_id = "all";
    next.polling_station_name = "Të gjitha vendvotimet";
  }
  return next;
};

const getEmptyTableColSpan = (filters: FilterState) => {
  let count = 2; // delta + party
  count += 1; // candidate
  if (filters.granularity !== "national") count += 1;
  if (filters.granularity === "voting-station") count += 1;
  return count;
};

const getPartyTableColSpan = (filters: FilterState) => {
  let count = 3; // abs votes + net + party
  if (filters.granularity !== "national") count += 1;
  if (filters.granularity === "voting-station") count += 1;
  return count;
};

const PARTY_ROW_HEIGHT = 52;
const CANDIDATE_ROW_HEIGHT = 60;

const getCandidateRowKey = (record: KqzRecountDeltaRecord) =>
  `${record.municipality_id}-${record.voting_station_id}-${record.polling_station_id}-${record.party_id}-${record.candidate_id}-${record.level}`;

export function RecountDiffExplorer() {
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);

  const updateFilter =
    <K extends keyof FilterState>(key: K) =>
    (value: FilterState[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <DatasetRenderer<KqzRecountDeltaDataset>
      datasetLoader={async () =>
        buildKqzRecountDeltaDataset(
          await loadDataset("kqz.parliamentary-recount-diff", {
            cache: "no-store",
          }),
        )
      }
      queryKey={["kqz", "recount-diff"]}
      queryOptions={{ staleTime: 24 * 60 * 60 * 1000 }}
      id="rinumrimi-votave"
      title="Diferencat e rinumërimit 2025"
      description="Eksploro ndryshimet mes numërimit fillestar dhe rinumërimit vetëm për vendvotimet që u rishikuan."
      isEmpty={(dataset) => dataset.records.length === 0}
    >
      {(dataset) => (
        <RecountDiffContent
          dataset={dataset}
          filters={filters}
          updateFilter={updateFilter}
        />
      )}
    </DatasetRenderer>
  );
}

function RecountDiffContent({
  dataset,
  filters,
  updateFilter,
}: {
  dataset: KqzRecountDeltaView;
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(
    key: K,
  ) => (value: FilterState[K]) => void;
}) {
  const { records } = dataset;

  const candidateRecords = React.useMemo(
    () =>
      records.filter(
        (record) =>
          record.level === "candidate" && record.candidate_id !== "total",
      ),
    [records],
  );

  const municipalityOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    candidateRecords.forEach((record) => {
      if (!record.municipality_id) return;
      map.set(
        record.municipality_id,
        record.municipality_name ?? record.municipality_id,
      );
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [candidateRecords]);

  const partyOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    candidateRecords.forEach((record) => {
      if (!record.party_id) return;
      map.set(
        record.party_id,
        record.party_name
          ? `${record.party_id} - ${record.party_name}`
          : record.party_id,
      );
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }))
      .map(([id, label]) => ({ id, label }));
  }, [candidateRecords]);

  const filteredCandidateRecords = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return candidateRecords.filter((record) => {
      if (filters.direction === "positive" && record.delta <= 0) {
        return false;
      }
      if (filters.direction === "negative" && record.delta >= 0) {
        return false;
      }
      if (filters.municipality !== "all") {
        if (record.municipality_id !== filters.municipality) return false;
      }
      if (filters.party !== "all") {
        if (record.party_id !== filters.party) return false;
      }
      if (!search) return true;
      const haystack = [
        record.municipality_name,
        record.voting_station_name,
        record.polling_station_name,
        record.party_id,
        record.party_name,
        record.candidate_id,
        record.candidate_name,
        record.polling_station_id,
        record.voting_station_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [candidateRecords, filters]);

  const aggregatedCandidates = React.useMemo(() => {
    const map = new Map<string, KqzRecountDeltaRecord>();
    filteredCandidateRecords.forEach((record) => {
      const bucket = getGranularityBucket(record, filters.granularity);
      const key = [bucket, record.party_id, record.candidate_id].join("|");
      const existing = map.get(key);
      if (existing) {
        existing.delta += record.delta;
        return;
      }
      map.set(key, withGranularityLabels(record, filters.granularity));
    });
    return Array.from(map.values());
  }, [filteredCandidateRecords, filters.granularity]);

  const partyDeltaByBucket = React.useMemo(() => {
    const totals = new Map<string, { abs: number; net: number }>();
    const labels = new Map<string, KqzRecountDeltaRecord>();
    filteredCandidateRecords.forEach((record) => {
      const bucket = getGranularityBucket(record, filters.granularity);
      const key = `${bucket}|${record.party_id}`;
      const current = totals.get(key) ?? { abs: 0, net: 0 };
      totals.set(key, {
        abs: current.abs + Math.abs(record.delta),
        net: current.net + record.delta,
      });
      if (!labels.has(key)) {
        labels.set(key, withGranularityLabels(record, filters.granularity));
      }
    });
    return { totals, labels };
  }, [filteredCandidateRecords, filters.granularity]);

  const sortedCandidates = React.useMemo(() => {
    const list = [...aggregatedCandidates];
    if (filters.sort === "candidate") {
      return list.sort((a, b) => {
        const nameA = a.candidate_name ?? a.candidate_id ?? "";
        const nameB = b.candidate_name ?? b.candidate_id ?? "";
        const partyA = a.party_name ?? a.party_id ?? "";
        const partyB = b.party_name ?? b.party_id ?? "";
        const nameDiff = nameA.localeCompare(nameB);
        if (nameDiff !== 0) return nameDiff;
        const partyDiff = partyA.localeCompare(partyB);
        if (partyDiff !== 0) return partyDiff;
        return Math.abs(b.delta) - Math.abs(a.delta);
      });
    }
    return list.sort((a, b) => {
      const diff = Math.abs(b.delta) - Math.abs(a.delta);
      if (diff !== 0) return diff;
      return b.delta - a.delta;
    });
  }, [aggregatedCandidates, filters.sort]);

  const worstOffenderCandidates = React.useMemo(() => {
    const list = aggregatedCandidates.filter((record) => record.delta < 0);
    return list
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 10);
  }, [aggregatedCandidates]);

  const emptyStateColSpan = getEmptyTableColSpan(filters);

  const uniqueCandidates = React.useMemo(() => {
    const set = new Set<string>();
    candidateRecords.forEach((record) =>
      set.add(`${record.party_id}-${record.candidate_id}`),
    );
    return set.size;
  }, [candidateRecords]);

  const changedPollingStations = React.useMemo(() => {
    const set = new Set<string>();
    candidateRecords.forEach((record) => set.add(record.polling_station_id));
    return set.size;
  }, [candidateRecords]);

  const shiftedVoteTotal = React.useMemo(
    () =>
      filteredCandidateRecords.reduce(
        (total, record) => total + Math.abs(record.delta),
        0,
      ),
    [filteredCandidateRecords],
  );

  const netVoteTotal = React.useMemo(
    () =>
      filteredCandidateRecords.reduce(
        (total, record) => total + record.delta,
        0,
      ),
    [filteredCandidateRecords],
  );

  const partyImpactRows = React.useMemo(() => {
    const rows = Array.from(partyDeltaByBucket.totals.entries()).map(
      ([key, totals]) => ({
        key,
        totals,
        record: partyDeltaByBucket.labels.get(key),
      }),
    );
    return rows
      .filter((row) => row.record)
      .sort((a, b) => b.totals.abs - a.totals.abs);
  }, [partyDeltaByBucket]);

  const partyTableRef = React.useRef<HTMLDivElement | null>(null);
  const getPartyScrollElement = React.useCallback(
    () => partyTableRef.current,
    [],
  );
  const estimatePartySize = React.useCallback(() => PARTY_ROW_HEIGHT, []);
  const getPartyItemKey = React.useCallback(
    (index: number) => partyImpactRows[index]?.key ?? index,
    [partyImpactRows],
  );
  const partyVirtualizer = useVirtualizer({
    count: partyImpactRows.length,
    getScrollElement: getPartyScrollElement,
    estimateSize: estimatePartySize,
    overscan: 8,
    getItemKey: getPartyItemKey,
  });

  const partyVirtualItems = partyVirtualizer.getVirtualItems();
  const partyTotalSize = partyVirtualizer.getTotalSize();

  const candidateTableRef = React.useRef<HTMLDivElement | null>(null);
  const getCandidateScrollElement = React.useCallback(
    () => candidateTableRef.current,
    [],
  );
  const estimateCandidateSize = React.useCallback(
    () => CANDIDATE_ROW_HEIGHT,
    [],
  );
  const getCandidateItemKey = React.useCallback(
    (index: number) =>
      sortedCandidates[index]
        ? getCandidateRowKey(sortedCandidates[index])
        : index,
    [sortedCandidates],
  );
  const candidateVirtualizer = useVirtualizer({
    count: sortedCandidates.length,
    getScrollElement: getCandidateScrollElement,
    estimateSize: estimateCandidateSize,
    overscan: 12,
    getItemKey: getCandidateItemKey,
  });

  const candidateVirtualItems = candidateVirtualizer.getVirtualItems();
  const candidateTotalSize = candidateVirtualizer.getTotalSize();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendvotime me ndryshime
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCount(changedPollingStations)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kandidatë të prekur
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCount(uniqueCandidates)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vota të zhvendosura (abs.)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Shuma absolute e ndryshimeve tregon sa vota u ridrejtuan brenda
              partive, pa u anuluar nga drejtimi.
            </p>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCount(shiftedVoteTotal)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Efekti neto i ndryshimeve
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Shuma neto e ndryshimeve tregon efektin final pasi pluset dhe
              minuset anulohen.
            </p>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatDelta(netVoteTotal)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Granulariteti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OptionSelector
            value={filters.granularity}
            onChange={(value) =>
              updateFilter("granularity")(value as FilterState["granularity"])
            }
            options={[
              { label: "Kombëtare", key: "national" },
              { label: "Komunë", key: "municipality" },
              { label: "Qendër votimi", key: "voting-station" },
            ]}
            className="w-full [&>div]:w-full [&>div]:flex-nowrap [&>div>button]:flex-1"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Zgjedh nivelin e agregimit. Kombëtare bashkon të gjitha vendvotimet e
            rinumëruara, ndërsa Komunë dhe Qendër votimi i grupojnë ndryshimet për
            secilën zonë.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            Kërko vendvotim ose kandidat
          </label>
          <Input
            value={filters.search}
            onChange={(event) => updateFilter("search")(event.target.value)}
            placeholder="p.sh. 0709/02 ose kandidat"
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Drejtimi
          </label>
          <NativeSelect
            value={filters.direction}
            onChange={(event) =>
              updateFilter("direction")(
                event.target.value as FilterState["direction"],
              )
            }
            className="mt-2"
          >
            <NativeSelectOption value="all">Të gjitha</NativeSelectOption>
            <NativeSelectOption value="negative">Negativ</NativeSelectOption>
            <NativeSelectOption value="positive">Pozitiv</NativeSelectOption>
          </NativeSelect>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Renditja
          </label>
          <NativeSelect
            value={filters.sort}
            onChange={(event) =>
              updateFilter("sort")(event.target.value as FilterState["sort"])
            }
            className="mt-2"
          >
            <NativeSelectOption value="delta">
              Sipas ndryshimit
            </NativeSelectOption>
            <NativeSelectOption value="candidate">
              Sipas kandidatit
            </NativeSelectOption>
          </NativeSelect>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Komuna
          </label>
          <NativeSelect
            value={filters.municipality}
            onChange={(event) => updateFilter("municipality")(event.target.value)}
            className="mt-2"
          >
            <NativeSelectOption value="all">Të gjitha</NativeSelectOption>
            {municipalityOptions.map(([id, label]) => (
              <NativeSelectOption key={id} value={id}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Subjekti
          </label>
          <NativeSelect
            value={filters.party}
            onChange={(event) => updateFilter("party")(event.target.value)}
            className="mt-2"
          >
            <NativeSelectOption value="all">Të gjitha</NativeSelectOption>
            {partyOptions.map((option) => (
              <NativeSelectOption key={option.id} value={option.id}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2" />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Hall of shame (humbësit më të mëdhenj)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Kandidatët me humbjen më të madhe të votave brenda partisë.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: "96px" }} />
                <col style={{ width: "96px" }} />
                <col />
                {filters.granularity === "national" ? null : (
                  <col style={{ width: "160px" }} />
                )}
                {filters.granularity === "voting-station" ? (
                  <col style={{ width: "180px" }} />
                ) : null}
              </colgroup>
              <thead className="sticky top-0 bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Ndryshimi</th>
                  <th className="px-4 py-3 text-left">Kandidati</th>
                  <th className="px-4 py-3 text-left">Subjekti</th>
                  {filters.granularity === "national" ? null : (
                    <th className="px-4 py-3 text-left">Komuna</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {worstOffenderCandidates.map((record) => (
                  <tr key={`shame-${getCandidateRowKey(record)}`}>
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatDelta(record.delta)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {record.candidate_name ?? record.candidate_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.candidate_id}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {record.party_name ?? record.party_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.party_id}
                      </div>
                    </td>
                    {filters.granularity === "national" ? null : (
                      <td className="px-4 py-2">
                        {record.municipality_name ?? record.municipality_id}
                      </td>
                    )}
                  </tr>
                ))}
                {worstOffenderCandidates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={filters.granularity === "national" ? 3 : 4}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Nuk ka të dhëna për filtrat e zgjedhur.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ndikimi i partive (vota të zhvendosura brenda partisë)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Shuma absolute tregon sa vota janë ridrejtuar brenda partisë, ndërsa
            efekti neto tregon balancën përfundimtare.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={partyTableRef}
            className="max-h-[320px] overflow-auto"
          >
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: "96px" }} />
                <col style={{ width: "180px" }} />
                <col />
                {filters.granularity === "national" ? null : (
                  <col style={{ width: "160px" }} />
                )}
                {filters.granularity === "voting-station" ? (
                  <col style={{ width: "180px" }} />
                ) : null}
              </colgroup>
              <thead className="sticky top-0 bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Vota abs.</th>
                  <th className="px-4 py-3 text-left">Efekti neto</th>
                  <th className="px-4 py-3 text-left">Subjekti</th>
                  {filters.granularity === "national" ? null : (
                    <th className="px-4 py-3 text-left">Komuna</th>
                  )}
                  {filters.granularity === "voting-station" ? (
                    <th className="px-4 py-3 text-left">Qendra e votimit</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y">
                {partyImpactRows.length > 0 ? (
                  <tr>
                    <td
                      colSpan={getPartyTableColSpan(filters)}
                      style={{
                        height: Math.max(
                          0,
                          partyVirtualItems[0]?.start ?? 0,
                        ),
                      }}
                    />
                  </tr>
                ) : null}
                {partyVirtualItems.map((virtualRow) => {
                  const row = partyImpactRows[virtualRow.index];
                  const record = row?.record;
                  if (!record) return null;
                  return (
                    <tr key={row.key}>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {formatCount(row.totals.abs)}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {formatDelta(row.totals.net)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium">
                          {record.party_name ?? record.party_id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {record.party_id}
                        </div>
                      </td>
                      {filters.granularity === "national" ? null : (
                        <td className="px-4 py-2">
                          {record.municipality_name ?? record.municipality_id}
                        </td>
                      )}
                      {filters.granularity === "voting-station" ? (
                        <td className="px-4 py-2">
                          <div className="font-medium">
                            {record.voting_station_name ??
                              record.voting_station_id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.polling_station_id}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
                {partyImpactRows.length > 0 ? (
                  <tr>
                    <td
                      colSpan={getPartyTableColSpan(filters)}
                      style={{
                        height: Math.max(
                          0,
                          partyTotalSize -
                            (partyVirtualItems.at(-1)?.end ?? 0),
                        ),
                      }}
                    />
                  </tr>
                ) : null}
                {partyImpactRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={getPartyTableColSpan(filters)}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Nuk ka të dhëna për filtrat e zgjedhur.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          Ndryshimi pozitiv tregon vota të shtuar për kandidatin, ndërsa
          ndryshimi negativ tregon vota të humbura. Lista bazohet në kandidatët
          brenda të njëjtës parti.
        </div>
        <div
          ref={candidateTableRef}
          className="max-h-[520px] overflow-auto"
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/70 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Ndryshimi</th>
                <th className="px-4 py-3 text-left">Subjekti</th>
                <th className="px-4 py-3 text-left">Kandidati</th>
                {filters.granularity === "national" ? null : (
                  <th className="px-4 py-3 text-left">Komuna</th>
                )}
                {filters.granularity === "voting-station" ? (
                  <th className="px-4 py-3 text-left">Qendra e votimit</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedCandidates.length > 0 ? (
                <tr>
                  <td
                    colSpan={emptyStateColSpan}
                    style={{
                      height: Math.max(
                        0,
                        candidateVirtualItems[0]?.start ?? 0,
                      ),
                    }}
                  />
                </tr>
              ) : null}
              {candidateVirtualItems.map((virtualRow) => {
                const record = sortedCandidates[virtualRow.index];
                if (!record) return null;
                return (
                  <tr key={getCandidateRowKey(record)}>
                    <td className="px-4 py-2">
                      <Badge
                        variant={record.delta < 0 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {formatDelta(record.delta)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {record.party_name ?? record.party_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.party_id}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {record.candidate_name ?? record.candidate_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.candidate_id}
                      </div>
                    </td>
                    {filters.granularity === "national" ? null : (
                      <td className="px-4 py-2">
                        {record.municipality_name ?? record.municipality_id}
                      </td>
                    )}
                    {filters.granularity === "voting-station" ? (
                      <td className="px-4 py-2">
                        <div className="font-medium">
                          {record.voting_station_name ??
                            record.voting_station_id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {record.polling_station_id}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
              {sortedCandidates.length > 0 ? (
                <tr>
                  <td
                    colSpan={emptyStateColSpan}
                    style={{
                      height: Math.max(
                        0,
                        candidateTotalSize -
                          (candidateVirtualItems.at(-1)?.end ?? 0),
                      ),
                    }}
                  />
                </tr>
              ) : null}
              {sortedCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={emptyStateColSpan}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Nuk ka të dhëna për filtrat e zgjedhur.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Shpjegim i thjeshtë
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Çdo votues zgjedh një parti dhe deri në 10 kandidatë nga ajo parti.
            Shumë qytetarë zgjedhin më pak se 10. Në disa vendnumërime, janë
            shtuar kandidatë shtesë ose janë zhvendosur vota brenda të njëjtës
            parti, edhe kur votuesi nuk i kishte shënuar.
          </p>
          <p>
            Kjo faqe tregon ndryshimet mes numërimit fillestar dhe rinumërimit
            të KQZ-së. Kjo nuk ndryshon votën për parti, por tregon nëse votat
            për kandidat janë lëvizur.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pyetje të shpeshta (FAQ)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <div className="font-medium text-foreground">
              Çfarë do të thotë “Vota të zhvendosura (abs.)”?
            </div>
            <p>
              Është shuma e të gjitha ndryshimeve pa marrë parasysh drejtimin.
              Kjo tregon sa vota janë lëvizur brenda partisë.
            </p>
          </div>
          <div>
            <div className="font-medium text-foreground">
              Po nëse një qytetar ka zgjedhur më pak se 10 kandidatë?
            </div>
            <p>
              Është e zakonshme të zgjidhen më pak se 10. Problemi lind kur gjatë
              numërimit janë shtuar kandidatë që votuesi nuk i kishte shënuar.
            </p>
          </div>
          <div>
            <div className="font-medium text-foreground">
              Çfarë do të thotë “Efekti neto i ndryshimeve”?
            </div>
            <p>
              Është shuma me shenjë (+/‑). Pluset dhe minuset anulohen, prandaj
              tregon rezultatin final, jo madhësinë e lëvizjes.
            </p>
          </div>
          <div>
            <div className="font-medium text-foreground">
              Pse një kandidat ka ndryshim negativ?
            </div>
            <p>
              Do të thotë se në rinumërim ai kandidat ka më pak vota se në
              numërimin fillestar. Këto vota zakonisht shkojnë te kandidatët e
              tjerë të së njëjtës parti.
            </p>
          </div>
          <div>
            <div className="font-medium text-foreground">
              Çfarë tregon “Hall of shame”?
            </div>
            <p>
              Liston kandidatët që kanë humbjet më të mëdha të votave brenda
              partisë, sipas rinumërimit.
            </p>
          </div>
          <div>
            <div className="font-medium text-foreground">
              A ndryshon kjo rezultatin e partisë?
            </div>
            <p>
              Jo. Këto ndryshime janë brenda të njëjtës parti dhe prekin vetëm
              renditjen e kandidatëve, jo votën e partisë.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        ID-të e subjekteve dhe kandidatëve shfaqen sipas listës së KQZ-së. Për
        emra të plotë, shih listat zyrtare të kandidatëve.
      </div>
    </div>
  );
}
