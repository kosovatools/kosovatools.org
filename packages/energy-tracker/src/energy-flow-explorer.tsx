"use client";

import * as React from "react";
import { Info } from "lucide-react";

import {
  DailyFlowChart,
  MonthlyFlowTrendChart,
  NeighborNetBalanceChart,
} from "./energy-flow-chart";
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

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";

const mwhFormatter = new Intl.NumberFormat("sq-AL", {
  maximumFractionDigits: 0,
});

const signedMwhFormatter = new Intl.NumberFormat("sq-AL", {
  maximumFractionDigits: 0,
  signDisplay: "always",
});

const gwhFormatter = new Intl.NumberFormat("sq-AL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const signedGwhFormatter = new Intl.NumberFormat("sq-AL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
  signDisplay: "always",
});

const percentFormatter = new Intl.NumberFormat("sq-AL", {
  style: "percent",
  maximumFractionDigits: 1,
});

function formatMWh(value: number): string {
  return `${mwhFormatter.format(value)} MWh`;
}

function formatGWh(value: number): string {
  return `${gwhFormatter.format(value / 1_000)} GWh`;
}

function formatSignedMWh(value: number): string {
  return `${signedMwhFormatter.format(value)} MWh`;
}

function formatSignedGWh(value: number): string {
  return `${signedGwhFormatter.format(value / 1_000)} GWh`;
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

export function EnergyFlowExplorer() {
  const [index, setIndex] = React.useState<EnergyFlowIndex | null>(null);
  const [dailyLatest, setDailyLatest] =
    React.useState<EnergyFlowDailyLatest | null>(null);
  const [monthly, setMonthly] = React.useState<EnergyFlowSnapshot | null>(null);
  const [selectedId, setSelectedId] = React.useState("");
  const lastLoadedSnapshotId = React.useRef<string>("");
  const [isIndexLoading, setIsIndexLoading] = React.useState(true);
  const [isMonthlyLoading, setIsMonthlyLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [monthlyError, setMonthlyError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsIndexLoading(true);
      setError(null);
      try {
        const [indexData, latestDaily] = await Promise.all([
          loadIndex(),
          loadLatestDaily().catch(() => null),
        ]);
        if (cancelled) return;
        setIndex(indexData);
        if (latestDaily) {
          setDailyLatest(latestDaily);
        }
        const lastId = indexData.months.at(-1)?.id ?? "";
        if (lastId) {
          setSelectedId((current) => current || lastId);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            "Nuk arritëm të marrim indeksin e fluksit të energjisë nga ENTSO-E.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsIndexLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!selectedId || lastLoadedSnapshotId.current === selectedId) {
      return;
    }

    let cancelled = false;
    setIsMonthlyLoading(true);
    setMonthlyError(null);
    setMonthly(null);

    loadMonthly(selectedId)
      .then((snapshot) => {
        if (!cancelled) {
          setMonthly(snapshot);
          lastLoadedSnapshotId.current = snapshot.id;
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setMonthly(null);
          setMonthlyError(
            "Periudha e përzgjedhur mujore nuk u ngarkua. Provoni një muaj tjetër.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsMonthlyLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const monthlyPoints = React.useMemo<EnergyFlowMonthlyPoint[]>(() => {
    if (!index) {
      return [];
    }
    return indexToMonthlyPoints(index);
  }, [index]);

  const snapshot = monthly;
  const neighbors = snapshot?.neighbors ?? [];
  const totals = snapshot?.totals ?? { importMWh: 0, exportMWh: 0, netMWh: 0 };
  const totalImports = totals.importMWh;
  const totalExports = totals.exportMWh;
  const netBalance = totals.netMWh;

  const periodLabel = snapshot
    ? formatPeriodLabel(snapshot.periodStart, snapshot.periodEnd)
    : null;

  const dailyData = React.useMemo(() => {
    if (!snapshot || !dailyLatest || dailyLatest.snapshotId !== snapshot.id) {
      return [];
    }
    return dailyLatest.days;
  }, [snapshot, dailyLatest]);

  const peakImportDay = React.useMemo(
    () =>
      selectTop(
        dailyData,
        (day) => day.imports,
        (candidate, current) => candidate > current,
      ),
    [dailyData],
  );
  const peakExportDay = React.useMemo(
    () =>
      selectTop(
        dailyData,
        (day) => day.exports,
        (candidate, current) => candidate > current,
      ),
    [dailyData],
  );
  const strongestNetImportDay = React.useMemo(
    () =>
      selectTop(
        dailyData,
        (day) => day.net,
        (candidate, current) => candidate > current,
      ),
    [dailyData],
  );
  const strongestNetExportDay = React.useMemo(
    () =>
      selectTop(
        dailyData,
        (day) => day.net,
        (candidate, current) => candidate < current,
      ),
    [dailyData],
  );

  const availableMonths = index?.months ?? [];
  const generatedLabel = index ? formatTimestamp(index.generatedAt) : null;

  if (isIndexLoading) {
    return (
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>Duke ngarkuar periudhat nga ENTSO-E</AlertTitle>
        <AlertDescription>
          Duke marrë indeksin më të fundit të fluksit ndërkufitar të energjisë…
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Të dhënat nuk u ngarkuan</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

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

  const topImportShare =
    snapshot && topImport && totalImports > 0
      ? topImport.importMWh / totalImports
      : 0;
  const topExportShare =
    snapshot && topExport && totalExports > 0
      ? topExport.exportMWh / totalExports
      : 0;

  return (
    <article className="space-y-8">
      {monthlyError ? (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Periudha nuk është e disponueshme</AlertTitle>
          <AlertDescription>{monthlyError}</AlertDescription>
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
                      {formatMWh(peakImportDay.imports)}
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
                      {formatMWh(peakExportDay.exports)}
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
                      {formatSignedMWh(strongestNetImportDay.net)}
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
                      {formatSignedMWh(strongestNetExportDay.net)}
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
                {isMonthlyLoading ? <p>Duke ngarkuar periudhën…</p> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Importet
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {snapshot ? formatGWh(totalImports) : "Pa të dhëna"}
              </p>
              <p className="text-xs text-muted-foreground">
                {snapshot ? formatMWh(totalImports) : "Në pritje të periudhës"}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Eksportet
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {snapshot ? formatGWh(totalExports) : "Pa të dhëna"}
              </p>
              <p className="text-xs text-muted-foreground">
                {snapshot ? formatMWh(totalExports) : "Në pritje të periudhës"}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Bilanci neto i importeve
              </p>
              <p
                className={cn(
                  "mt-2 text-2xl font-semibold",
                  snapshot
                    ? netBalance >= 0
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {snapshot ? formatSignedGWh(netBalance) : "Pa të dhëna"}
              </p>
              <p className="text-xs text-muted-foreground">
                {snapshot
                  ? formatSignedMWh(netBalance)
                  : "Në pritje të periudhës"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-muted-foreground">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Partneri më i madh i importit
              </p>
              <p className="mt-1 text-sm text-foreground">
                {snapshot && topImport
                  ? `${topImport.country} (${formatMWh(topImport.importMWh)}) · ${percentFormatter.format(topImportShare || 0)} e importeve`
                  : "Nuk ka të dhëna për importet."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {snapshot && topNetImport
                  ? `Importuesi neto më i madh: ${topNetImport.country} (${formatSignedMWh(topNetImport.netMWh)}).`
                  : "Të dhënat neto për importin mungojnë."}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Destinacioni më i madh i eksportit
              </p>
              <p className="mt-1 text-sm text-foreground">
                {snapshot && topExport
                  ? `${topExport.country} (${formatMWh(topExport.exportMWh)}) · ${percentFormatter.format(topExportShare || 0)} e eksporteve`
                  : "Nuk ka të dhëna për eksportet."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {snapshot && topNetExport
                  ? `Eksportuesi neto më i fortë: ${topNetExport.country} (${formatSignedMWh(topNetExport.netMWh)}).`
                  : "Të dhënat neto për eksportin mungojnë."}
              </p>
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
          <NeighborNetBalanceChart data={neighbors} />
          <Separator />
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
                {neighbors.map((row) => (
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
                      {row.hasData ? formatMWh(row.importMWh) : "Pa të dhëna"}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {row.hasData ? formatMWh(row.exportMWh) : "Pa të dhëna"}
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
                        ? formatSignedMWh(row.netMWh)
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
