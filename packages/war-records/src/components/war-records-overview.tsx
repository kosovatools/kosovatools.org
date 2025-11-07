import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";

import { crimeStats, findBreakdownCount } from "../data";
import { formatLabel } from "../lib/format";
import { AgeDistributionPlot } from "./age-distribution-plot";
import type { CrimeStats } from "../types";
import { formatCount } from "@workspace/chart-utils";

type BreakdownListProps = {
  title: string;
  description?: string;
  items: CrimeStats["violationBreakdown"];
  emptyLabel?: string;
  maxItems?: number;
};

function BreakdownList({
  title,
  description,
  items,
  maxItems = 6,
  emptyLabel = "S’ka të dhëna",
}: BreakdownListProps) {
  const display = items.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {display.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyLabel}</p>
        ) : (
          <ul className="space-y-3">
            {display.map((entry) => (
              <li
                key={`${title}-${entry.value}`}
                className="flex items-baseline justify-between gap-4 rounded-lg border border-transparent bg-muted/30 px-3 py-2"
              >
                <span className="text-sm font-medium uppercase tracking-wide">
                  {formatLabel(entry.value)}
                </span>
                <span className="text-foreground text-sm font-semibold">
                  {formatCount(entry.count)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export type WarRecordsOverviewProps = {
  stats?: CrimeStats;
  className?: string;
};

export function WarRecordsOverview({
  stats = crimeStats,
  className,
}: WarRecordsOverviewProps) {
  const civilianCount = useMemo(
    () => findBreakdownCount(stats.statusBreakdown, "civilian"),
    [stats.statusBreakdown],
  );
  const armedCount = useMemo(
    () => findBreakdownCount(stats.statusBreakdown, "armed formations"),
    [stats.statusBreakdown],
  );

  const knownAgeShare = useMemo(() => {
    if (!stats.totals.records || !stats.totals.withKnownAge) {
      return null;
    }

    const ratio = stats.totals.withKnownAge / stats.totals.records;
    return `${Math.round(ratio * 100)}%`;
  }, [stats.totals.records, stats.totals.withKnownAge]);

  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <Card className="bg-gradient-to-br from-background via-background to-muted">
        <CardHeader className="gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl md:text-4xl">
              Arkivi i Viktimave të Luftës në Kosovë
            </CardTitle>
          </div>
          <CardDescription className="max-w-3xl text-base leading-relaxed">
            Arkivi dokumenton {formatCount(stats.totals.records)} persona të
            vrarë, zhdukur ose të vdekur nga dhuna e luftës në Kosovë më 1998–
            2000, sipas projektit Kosovo Memory Book të Humanitarian Law Center.
            Statistikat ofrojnë një pasqyrë të plotë të humbjeve pa e
            kategorizuar rolin ose statusin e secilit të regjistruar.
          </CardDescription>
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Jo të gjithë të dokumentuarit janë vrarë. Përtej vrasjeve ka persona
            të zhdukur dhe jetë të humbura nga dhuna e luftës.
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <figure className="rounded-lg border bg-background px-4 py-5 shadow-sm">
              <figcaption className="text-muted-foreground text-xs uppercase tracking-wide">
                Rekorde të dokumentuara
              </figcaption>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatCount(stats.totals.records)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Përfshirë të vrarë, të zhdukurit dhe vdekje të tjera nga lufta.
              </p>
            </figure>
            <figure className="rounded-lg border bg-background px-4 py-5 shadow-sm">
              <figcaption className="text-muted-foreground text-xs uppercase tracking-wide">
                Civilë të vrarë ose zhdukur
              </figcaption>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatCount(civilianCount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Individë jashtë formacioneve të armatosura.
              </p>
            </figure>
            <figure className="rounded-lg border bg-background px-4 py-5 shadow-sm">
              <figcaption className="text-muted-foreground text-xs uppercase tracking-wide">
                Pjesëtarë të formacioneve të armatosura
              </figcaption>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatCount(armedCount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Përfshirë të gjithë të identifikuarit në formacione.
              </p>
            </figure>
            <figure className="rounded-lg border bg-background px-4 py-5 shadow-sm">
              <figcaption className="text-muted-foreground text-xs uppercase tracking-wide">
                Të mitur &amp; të moshuar
              </figcaption>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatCount(stats.ageInsights.minorsUnder18)}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  fëmijë
                </span>
              </p>
              <p className="text-foreground text-xl font-semibold tracking-tight">
                {formatCount(stats.ageInsights.seniors65Plus)}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  65+
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {knownAgeShare
                  ? `${knownAgeShare} e regjistrimeve kanë moshë të njohur.`
                  : "Mosha e panjohur për disa persona."}
              </p>
            </figure>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Krimet e raportuara</CardTitle>
              <CardDescription>
                Kategoritë janë përcaktuar nga Kosovo Memory Book (HLC): vrasje,
                zhdukje dhe vdekje nga dhuna e luftës.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-4 sm:grid-cols-3">
                {stats.violationBreakdown.map((entry) => (
                  <li key={`violation-${entry.value}`}>
                    <div className="rounded-lg border bg-background px-4 py-4 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {formatLabel(entry.value)}
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatCount(entry.count)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etnicitetet dhe gjinoret</CardTitle>
              <CardDescription>
                Shpërndarja sipas identiteteve të raportuara në arkiv.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Gjinia
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {stats.genderBreakdown.map((entry) => (
                      <li
                        key={`gender-${entry.value}`}
                        className="flex justify-between gap-4 rounded-md bg-muted/40 px-3 py-2"
                      >
                        <span className="font-medium uppercase tracking-wide">
                          {entry.value === "m"
                            ? "Meshkuj"
                            : entry.value === "f"
                              ? "Femra"
                              : formatLabel(entry.value)}
                        </span>
                        <span className="font-semibold">
                          {formatCount(entry.count)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Etniciteti (top 8)
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {stats.ethnicityBreakdown.slice(0, 8).map((entry) => (
                      <li
                        key={`ethnicity-${entry.value}`}
                        className="flex justify-between gap-4 rounded-md bg-muted/40 px-3 py-2"
                      >
                        <span className="font-medium">
                          {formatLabel(entry.value)}
                        </span>
                        <span className="font-semibold">
                          {formatCount(entry.count)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <BreakdownList
            title="Kronologjia"
            description="Shpërndarja vjetore e incidenteve të raportuara."
            items={stats.incidentYearBreakdown}
            maxItems={5}
          />
          <BreakdownList
            title="Komunat më të prekura"
            description="Sipas vendit të incidentit."
            items={stats.topMunicipalities}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mosha dhe familjet</CardTitle>
          <CardDescription>
            Të dhënat e moshës janë të rrumbullakosura në vite të plota.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/40 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Mosha mesatare
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {stats.ageInsights.average ?? "—"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  vjeç
                </span>
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Mosha mediane
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {stats.ageInsights.median ?? "—"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  vjeç
                </span>
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Më i riu
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {stats.ageInsights.min ?? "—"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  vjeç
                </span>
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Më i moshuari
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {stats.ageInsights.max ?? "—"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  vjeç
                </span>
              </p>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            {formatCount(stats.ageInsights.minorsUnder18)} fëmijë dhe{" "}
            {formatCount(stats.ageInsights.seniors65Plus)} persona mbi moshën
            65 vjeç u humbën.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shpërndarja sipas moshës</CardTitle>
          <CardDescription>
            Çdo pikë tregon moshën gjatë incidentit; madhësia sa herë është
            regjistruar ajo moshë në bazë.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgeDistributionPlot data={stats.ageBreakdown} />
        </CardContent>
      </Card>
    </section>
  );
}
