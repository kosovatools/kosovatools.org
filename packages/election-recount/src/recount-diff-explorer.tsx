"use client";

import * as React from "react";
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

type FilterState = {
  search: string;
  level: "all" | "party" | "candidate";
  granularity: "national" | "municipality" | "voting-station";
  sort: "delta" | "candidate";
  direction: "all" | "positive" | "negative";
  municipality: string;
  party: string;
  minAbsDelta: number;
  limit: number;
};

const DEFAULT_FILTERS: FilterState = {
  search: "",
  level: "candidate",
  granularity: "national",
  sort: "delta",
  direction: "all",
  municipality: "all",
  party: "all",
  minAbsDelta: 3,
  limit: 50,
};

const formatDelta = (value: number) =>
  `${value > 0 ? "+" : ""}${formatCount(value)}`;

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

  const municipalityOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((record) => {
      if (!record.municipality_id) return;
      map.set(
        record.municipality_id,
        record.municipality_name ?? record.municipality_id,
      );
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [records]);

  const partyOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((record) => {
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
  }, [records]);

  const filtered = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return records.filter((record) => {
      if (filters.level !== "all" && record.level !== filters.level) {
        return false;
      }
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
      if (Math.abs(record.delta) < filters.minAbsDelta) {
        return false;
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
  }, [records, filters]);

  const aggregated = React.useMemo(() => {
    const map = new Map<string, typeof records[number]>();
    filtered.forEach((record) => {
      const bucket =
        filters.granularity === "national"
          ? "national"
          : filters.granularity === "municipality"
            ? record.municipality_id
            : `${record.municipality_id}::${record.voting_station_id}`;
      const key = [
        bucket,
        record.level,
        record.party_id,
        record.candidate_id,
      ].join("|");
      const existing = map.get(key);
      if (existing) {
        existing.delta += record.delta;
        return;
      }
      const next = { ...record };
      if (filters.granularity === "national") {
        next.municipality_id = "0";
        next.municipality_name = "Kombëtare";
        next.voting_station_id = "all";
        next.voting_station_name = "Të gjitha qendrat e votimit";
        next.polling_station_id = "all";
        next.polling_station_name = "Të gjitha vendvotimet";
      } else if (filters.granularity === "municipality") {
        next.voting_station_id = "all";
        next.voting_station_name = "Të gjitha qendrat e votimit";
        next.polling_station_id = "all";
        next.polling_station_name = "Të gjitha vendvotimet";
      } else {
        next.polling_station_id = "all";
        next.polling_station_name = "Të gjitha vendvotimet";
      }
      map.set(key, next);
    });
    return Array.from(map.values());
  }, [filtered, filters.granularity]);

  const sorted = React.useMemo(() => {
    const list = [...aggregated];
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
  }, [aggregated, filters.sort]);

  const limited = sorted.slice(0, filters.limit);

  const uniqueCandidates = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((record) => {
      if (record.level === "candidate") {
        set.add(`${record.party_id}-${record.candidate_id}`);
      }
    });
    return set.size;
  }, [records]);

  const changedPollingStations = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((record) => set.add(record.polling_station_id));
    return set.size;
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Niveli i analizës
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OptionSelector
            value={filters.level}
            onChange={(value) =>
              updateFilter("level")(value as FilterState["level"])
            }
            options={[
              { label: "Kandidat", key: "candidate" },
              { label: "Parti", key: "party" },
            ]}
            className="w-full [&>div]:w-full [&>div]:flex-nowrap [&>div>button]:flex-1"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Zgjidh nëse po shfaqen ndryshimet për kandidatë apo vetëm totalet e
            partive.
          </p>
        </CardContent>
      </Card>

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Min. ndryshim absolut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min={0}
              value={filters.minAbsDelta}
              onChange={(event) =>
                updateFilter("minAbsDelta")(
                  Math.max(0, Number(event.target.value)),
                )
              }
            />
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rekorde të filtruara
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCount(aggregated.length)}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/70 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Ndryshimi</th>
                <th className="px-4 py-3 text-left">Subjekti</th>
                {filters.level === "party" ? null : (
                  <th className="px-4 py-3 text-left">Kandidati</th>
                )}
                {filters.granularity === "national" ? null : (
                  <th className="px-4 py-3 text-left">Komuna</th>
                )}
                {filters.granularity === "voting-station" ? (
                  <th className="px-4 py-3 text-left">Qendra e votimit</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y">
              {limited.map((record) => (
                <tr
                  key={`${record.municipality_id}-${record.voting_station_id}-${record.polling_station_id}-${record.party_id}-${record.candidate_id}-${record.level}`}
                >
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
                  {filters.level === "party" ? null : (
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {record.candidate_id === "total"
                          ? "Totali i partisë"
                          : record.candidate_name ?? record.candidate_id}
                      </div>
                      {record.candidate_id === "total" ? null : (
                        <div className="text-xs text-muted-foreground">
                          {record.candidate_id}
                        </div>
                      )}
                    </td>
                  )}
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
              ))}
              {limited.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      filters.granularity === "national"
                        ? filters.level === "party"
                          ? 3
                          : 4
                        : filters.granularity === "municipality"
                          ? filters.level === "party"
                            ? 4
                            : 5
                          : filters.level === "party"
                            ? 5
                            : 6
                    }
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

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        ID-të e subjekteve dhe kandidatëve shfaqen sipas listës së KQZ-së. Për
        emra të plotë, shih listat zyrtare të kandidatëve.
      </div>
    </div>
  );
}
