"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { DailyFlowChart, MonthlyFlowTrendChart } from "./energy-flow-chart";
import {
  formatDayLabel,
  formatMonthLabel,
  formatPeriodLabel,
  formatTimestamp,
  indexToMonthlyPoints,
  loadIndex,
  loadLatestDaily,
  loadMonthly,
} from "./flow-service";
import type {
  EnergyFlowDailyLatest,
  EnergyFlowIndex,
  EnergyFlowMonthlyPoint,
  EnergyFlowSnapshot,
} from "./types";
import { EnergyFlowExplorerSkeleton } from "./energy-flow-explorer-skeleton";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import { formatAuto } from "./utils/number-format";
import { formatPercent } from "@workspace/utils";

type NeighborRow = EnergyFlowSnapshot["neighbors"][number];
type DailyRow = EnergyFlowDailyLatest["days"][number];

type FlowTotals = {
  importMWh: number;
  exportMWh: number;
  netMWh: number;
};

type ExplorerView = {
  snapshot: EnergyFlowSnapshot | null;
  availableMonths: EnergyFlowIndex["months"];
  selectedMonth: EnergyFlowIndex["months"][number] | null;
  generatedLabel: string | null;
  monthlyPoints: EnergyFlowMonthlyPoint[];
  periodLabel: string | null;
  totals: FlowTotals;
  neighbors: NeighborRow[];
  dailyData: DailyRow[];
  totalImports: number;
  totalExports: number;
  netBalance: number;
  peakImportDay: DailyRow | null;
  peakExportDay: DailyRow | null;
  strongestNetImportDay: DailyRow | null;
  strongestNetExportDay: DailyRow | null;
  topImport: NeighborRow | null;
  topExport: NeighborRow | null;
  topNetImport: NeighborRow | null;
  topNetExport: NeighborRow | null;
  topImportShare: number;
  topExportShare: number;
};

export function EnergyFlowExplorer() {
  return (
    <React.Suspense fallback={<EnergyFlowExplorerLoadingFallback />}>
      <EnergyFlowExplorerErrorBoundary>
        <EnergyFlowExplorerContent />
      </EnergyFlowExplorerErrorBoundary>
    </React.Suspense>
  );
}

function EnergyFlowExplorerLoadingFallback() {
  return <EnergyFlowExplorerSkeleton />;
}

class EnergyFlowExplorerErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle>Nuk u ngarkuan të dhënat</CardTitle>
            <CardDescription>
              Nuk arritëm të marrim flukset e energjisë nga ENTSO-E.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-destructive">
              {this.state.error.message || "Ndodhi një gabim i papritur."}
            </p>
            <Button variant="outline" onClick={this.handleRetry}>
              Provo përsëri
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

function selectTop<T>(
  entries: T[],
  selector: (entry: T) => number,
  comparator: (candidate: number, current: number) => boolean,
): T | null {
  let best: T | null = null;

  for (const entry of entries) {
    const candidate = selector(entry);
    if (!best || comparator(candidate, selector(best))) {
      best = entry;
    }
  }

  return best;
}

function buildExplorerView({
  index,
  snapshot,
  dailyLatest,
  selectedId,
}: {
  index: EnergyFlowIndex | null;
  snapshot: EnergyFlowSnapshot | null;
  dailyLatest: EnergyFlowDailyLatest | null;
  selectedId: string;
}): ExplorerView | null {
  if (!index) {
    return null;
  }

  const availableMonths = index.months ?? [];
  const selectedMonth =
    availableMonths.find((month) => month.id === selectedId) ?? null;
  const generatedLabel = formatTimestamp(index.generatedAt);
  const monthlyPoints = indexToMonthlyPoints(index);

  const totals: FlowTotals = snapshot?.totals ?? {
    importMWh: 0,
    exportMWh: 0,
    netMWh: 0,
  };
  const neighbors: NeighborRow[] = snapshot?.neighbors ?? [];

  const periodLabel = snapshot
    ? formatPeriodLabel(snapshot.periodStart, snapshot.periodEnd)
    : null;

  const dailyData: DailyRow[] =
    snapshot && dailyLatest && dailyLatest.snapshotId === snapshot.id
      ? dailyLatest.days
      : [];

  const peakImportDay = selectTop(
    dailyData,
    (day) => day.imports,
    (candidate, current) => candidate > current,
  );
  const peakExportDay = selectTop(
    dailyData,
    (day) => day.exports,
    (candidate, current) => candidate > current,
  );
  const strongestNetImportDay = selectTop(
    dailyData,
    (day) => day.net,
    (candidate, current) => candidate > current,
  );
  const strongestNetExportDay = selectTop(
    dailyData,
    (day) => day.net,
    (candidate, current) => candidate < current,
  );

  const topImport = selectTop(
    neighbors,
    (item) => item.importMWh,
    (candidate, current) => candidate > current,
  );
  const topExport = selectTop(
    neighbors,
    (item) => item.exportMWh,
    (candidate, current) => candidate > current,
  );
  const topNetImport = selectTop(
    neighbors,
    (item) => item.netMWh,
    (candidate, current) => candidate > current,
  );
  const topNetExport = selectTop(
    neighbors,
    (item) => item.netMWh,
    (candidate, current) => candidate < current,
  );

  const totalImports = totals.importMWh;
  const totalExports = totals.exportMWh;
  const netBalance = totals.netMWh;

  const topImportShare =
    topImport && totalImports > 0 ? topImport.importMWh / totalImports : 0;
  const topExportShare =
    topExport && totalExports > 0 ? topExport.exportMWh / totalExports : 0;

  return {
    snapshot,
    availableMonths,
    selectedMonth,
    generatedLabel,
    monthlyPoints,
    periodLabel,
    totals,
    neighbors,
    dailyData,
    totalImports,
    totalExports,
    netBalance,
    peakImportDay,
    peakExportDay,
    strongestNetImportDay,
    strongestNetExportDay,
    topImport,
    topExport,
    topNetImport,
    topNetExport,
    topImportShare,
    topExportShare,
  };
}

function EnergyFlowExplorerContent() {
  const { data: index } = useSuspenseQuery<EnergyFlowIndex, Error>({
    queryKey: ["energy-flow", "index"],
    queryFn: loadIndex,
  });

  const { data: dailyLatest } = useSuspenseQuery<
    EnergyFlowDailyLatest | null,
    Error
  >({
    queryKey: ["energy-flow", "daily-latest"],
    queryFn: async () => {
      try {
        return await loadLatestDaily();
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  });

  const mostRecentMonthId = React.useMemo(() => {
    if (!index?.months?.length) {
      return "";
    }
    return index.months[index.months.length - 1]?.id ?? "";
  }, [index]);

  const [selectedId, setSelectedId] = React.useState(mostRecentMonthId);

  React.useEffect(() => {
    if (!index?.months?.length) {
      setSelectedId("");
      return;
    }

    const mostRecentId = index.months[index.months.length - 1]?.id ?? "";

    if (!mostRecentId) {
      setSelectedId("");
      return;
    }

    setSelectedId((current) => {
      if (!current) {
        return mostRecentId;
      }
      const hasCurrent = index.months.some((month) => month.id === current);
      return hasCurrent ? current : mostRecentId;
    });
  }, [index]);

  const monthlyQuery = useSuspenseQuery<EnergyFlowSnapshot, Error>({
    queryKey: ["energy-flow", "monthly", selectedId],
    queryFn: () => loadMonthly(selectedId),
  });

  const snapshot = monthlyQuery.data ?? null;

  const derived = React.useMemo(
    () =>
      buildExplorerView({
        index,
        snapshot,
        dailyLatest,
        selectedId,
      }),
    [index, snapshot, dailyLatest, selectedId],
  );

  if (!derived) {
    return <EnergyFlowExplorerSkeleton />;
  }

  const {
    availableMonths,
    selectedMonth,
    generatedLabel,
    monthlyPoints,
    periodLabel,
    dailyData,
    totalImports,
    totalExports,
    netBalance,
    peakImportDay,
    peakExportDay,
    strongestNetImportDay,
    strongestNetExportDay,
    topImport,
    topExport,
    topNetImport,
    topNetExport,
    topImportShare,
    topExportShare,
    neighbors,
  } = derived;

  if (!availableMonths.length) {
    return (
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>Në pritje të të dhënave ENTSO-E</AlertTitle>
        <AlertDescription>
          Ende nuk ka periudha të flukseve ndërkufitare. Rikthehuni pas
          përfundimit të procesit mujor të përditësimit.
        </AlertDescription>
      </Alert>
    );
  }

  const isMonthlyFetching = monthlyQuery.isFetching;
  const monthlyStatusLabel =
    isMonthlyFetching && Boolean(selectedId)
      ? "Duke ngarkuar periudhën…"
      : null;

  const showSnapshotSkeleton = !snapshot && isMonthlyFetching;

  const monthlyErrorMessage = monthlyQuery.isError
    ? selectedMonth
      ? `Të dhënat për ${formatMonthLabel(selectedMonth.periodStart)} nuk u ngarkuan. Provoni një muaj tjetër.`
      : "Periudha e përzgjedhur mujore nuk u ngarkua. Provoni një muaj tjetër."
    : null;

  return (
    <article className="space-y-8">
      {monthlyErrorMessage ? (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Periudha nuk është e disponueshme</AlertTitle>
          <AlertDescription>{monthlyErrorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {dailyLatest ? (
        dailyData.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Modeli ditor i importeve dhe eksporteve</CardTitle>
              <CardDescription>
                Totalet ditore për{" "}
                {formatPeriodLabel(
                  dailyLatest.periodStart,
                  dailyLatest.periodEnd,
                )}
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DailyFlowChart data={dailyData} />
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
                {peakImportDay ? (
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Dita me importe më të larta
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDayLabel(peakImportDay.date)} —{" "}
                      {formatAuto(peakImportDay.imports)}
                    </p>
                  </div>
                ) : null}
                {peakExportDay ? (
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Dita me eksportet më të larta
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDayLabel(peakExportDay.date)} —{" "}
                      {formatAuto(peakExportDay.exports)}
                    </p>
                  </div>
                ) : null}
                {strongestNetImportDay ? (
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Importi neto më i lartë
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDayLabel(strongestNetImportDay.date)} —{" "}
                      {formatAuto(strongestNetImportDay.net, { signed: true })}
                    </p>
                  </div>
                ) : null}
                {strongestNetExportDay ? (
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Eksporti neto më i lartë
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDayLabel(strongestNetExportDay.date)} —{" "}
                      {formatAuto(strongestNetExportDay.net, { signed: true })}
                    </p>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Vlerat ditore paraqesin totalet për çdo ditë të regjistruar
                brenda muajit të përzgjedhur.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Shpërndarja ditore</CardTitle>
              <CardDescription>
                Totalet ditore janë të disponueshme vetëm për periudhën më të
                fundit ({formatMonthLabel(dailyLatest.periodStart)}).
              </CardDescription>
            </CardHeader>
          </Card>
        )
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Trendi mujor i importeve dhe eksporteve</CardTitle>
          <CardDescription>
            Ndiq kërkesën totale për import, aktivitetin e eksporteve dhe
            bilancin neto përgjatë muajve të disponueshëm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyFlowTrendChart data={monthlyPoints} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle>Gjurmues i fluksit të energjisë</CardTitle>
              <CardDescription>
                Ndiq importet, eksportet dhe bilancin neto të energjisë
                elektrike të Kosovës sipas dokumentit A11 të ENTSO-E
                Transparency Platform.
              </CardDescription>
            </div>
            <div className="w-full max-w-xs space-y-2 lg:text-right">
              <Label
                htmlFor="snapshot-select"
                className="text-xs uppercase text-muted-foreground"
              >
                Periudha
              </Label>
              <select
                id="snapshot-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {availableMonths.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatMonthLabel(item.periodStart)}
                  </option>
                ))}
              </select>
              <div className="space-y-1 text-xs text-muted-foreground">
                {generatedLabel ? (
                  <p>Indeksi i përditësuar më {generatedLabel}</p>
                ) : null}
                {monthlyStatusLabel ? <p>{monthlyStatusLabel}</p> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Importet
              </p>
              <div className="mt-2 text-2xl font-semibold">
                {snapshot ? (
                  formatAuto(totalImports)
                ) : showSnapshotSkeleton ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  "Pa të dhëna"
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Eksportet
              </p>
              <div className="mt-2 text-2xl font-semibold">
                {snapshot ? (
                  formatAuto(totalExports)
                ) : showSnapshotSkeleton ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  "Pa të dhëna"
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Bilanci neto i importeve
              </p>
              <div
                className={cn(
                  "mt-2 text-2xl font-semibold",
                  snapshot
                    ? netBalance >= 0
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {snapshot ? (
                  formatAuto(netBalance, { signed: true })
                ) : showSnapshotSkeleton ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  "Pa të dhëna"
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-muted-foreground">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Partneri më i madh i importit
              </p>
              <div className="mt-1 text-sm text-foreground">
                {snapshot && topImport ? (
                  `${topImport.country} (${formatAuto(topImport.importMWh)}) · ${formatPercent(topImportShare || 0)} e importeve`
                ) : showSnapshotSkeleton ? (
                  <Skeleton className="h-4 w-56" />
                ) : (
                  "Nuk ka të dhëna për importet."
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {snapshot && topNetImport ? (
                  `Importuesi neto më i madh: ${topNetImport.country} (${formatAuto(topNetImport.netMWh, { signed: true })}).`
                ) : showSnapshotSkeleton ? (
                  <Skeleton className="h-3 w-44" />
                ) : (
                  "Të dhënat neto për importin mungojnë."
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Destinacioni më i madh i eksportit
              </p>
              <div className="mt-1 text-sm text-foreground">
                {snapshot && topExport ? (
                  `${topExport.country} (${formatAuto(topExport.exportMWh)}) · ${formatPercent(topExportShare || 0)} e eksporteve`
                ) : showSnapshotSkeleton ? (
                  <Skeleton className="h-4 w-56" />
                ) : (
                  "Nuk ka të dhëna për eksportet."
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {snapshot && topNetExport ? (
                  `Eksportuesi neto më i fortë: ${topNetExport.country} (${formatAuto(topNetExport.netMWh, { signed: true })}).`
                ) : showSnapshotSkeleton ? (
                  <Skeleton className="h-3 w-44" />
                ) : (
                  "Të dhënat neto për eksportin mungojnë."
                )}
              </div>
            </div>
          </div>
          <p className="text-xs">
            Periudhat përditësohen çdo muaj nga repo <code>data</code> në GitHub
            Pages. Burimi: ENTSO-E Transparency Platform (dokumenti A11).
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bilanci neto sipas kufirit</CardTitle>
          <CardDescription>
            {periodLabel
              ? `Pozicioni neto për ${periodLabel}. Shtyllat pozitive tregojnë importe neto; shtyllat negative tregojnë eksporte neto.`
              : "Zgjidh një periudhë për të parë totalet sipas kufirit."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto text-sm">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Kufiri</th>
                  <th className="py-2 pr-4 text-right">Importet (MWh)</th>
                  <th className="py-2 pr-4 text-right">Eksportet (MWh)</th>
                  <th className="py-2 text-right">Bilanci neto (MWh)</th>
                </tr>
              </thead>
              <tbody>
                {showSnapshotSkeleton
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <tr
                        key={`skeleton-${index}`}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="py-2 pr-4">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="mt-2 h-3 w-16" />
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <Skeleton className="ml-auto h-4 w-24" />
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <Skeleton className="ml-auto h-4 w-24" />
                        </td>
                        <td className="py-2 text-right">
                          <Skeleton className="ml-auto h-4 w-24" />
                        </td>
                      </tr>
                    ))
                  : neighbors.map((row) => (
                      <tr
                        key={row.code}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="py-2 pr-4">
                          <div className="font-medium text-foreground">
                            {row.country}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.code}
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {row.hasData
                            ? formatAuto(row.importMWh)
                            : "Pa të dhëna"}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {row.hasData
                            ? formatAuto(row.exportMWh)
                            : "Pa të dhëna"}
                        </td>
                        <td
                          className={cn(
                            "py-2 text-right font-semibold",
                            row.hasData
                              ? row.netMWh >= 0
                                ? "text-destructive"
                                : "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {row.hasData
                            ? formatAuto(row.netMWh, { signed: true })
                            : "Pa të dhëna"}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
