import { useMemo } from "react";
import {
  FileText,
  Users,
  Shield,
  Baby,
  PersonStanding,
  Armchair,
  MapPin,
  CalendarDays,
  Info,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import { formatCount } from "@workspace/utils";

import { crimeStats, findBreakdownCount } from "../data";
import { formatLabel } from "../lib/format";
import { AgeDistributionPlot } from "./age-distribution-plot";
import type { CrimeStats } from "../types";

// --- Helper Components for cleaner UI ---

// A simple visual bar to show proportion in lists
function ProgressBar({
  value,
  total,
  label,
  count,
}: {
  value: string;
  total: number;
  label?: string;
  count: number;
}) {
  const percentage = Math.round((count / total) * 100) || 0;

  return (
    <div className="group flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground/90">
          {label || formatLabel(value)}
        </span>
        <span className="font-mono font-medium text-muted-foreground">
          {formatCount(count)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
        <div
          className="h-full rounded-full bg-primary/80 transition-all duration-500 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  className?: string;
  highlight?: boolean;
};

function StatCard({
  title,
  value,
  icon,
  description,
  className,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border p-5 transition-all",
        highlight
          ? "bg-primary/5 border-primary/20 shadow-sm"
          : "bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {typeof value === "number" ? formatCount(value) : value}
          </h3>
        </div>
        <div
          className={cn(
            "rounded-lg p-2.5",
            highlight
              ? "bg-background text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </div>
      </div>
      {description && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

// --- Main Component ---

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

  // Calculate totals for progress bars
  const totalEthnicity = stats.ethnicityBreakdown.reduce(
    (a, b) => a + b.count,
    0,
  );
  const totalGender = stats.genderBreakdown.reduce((a, b) => a + b.count, 0);
  const topMunicipalities = stats.topMunicipalities.slice(0, 8);
  const maxMuniCount = Math.max(...topMunicipalities.map((m) => m.count));

  return (
    <section className={cn("flex flex-col gap-10 pb-10", className)}>
      {/* Context Box */}
      <div className="border-b pb-8">
        <div className="flex items-start gap-3 rounded-lg border-l-4 border-l-amber-500/70 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/10 dark:text-amber-200/80">
          <Info className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
          <p>
            Jo të gjithë të dokumentuarit janë vrarë. Ky arkiv përfshin persona
            të zhdukur dhe jetë të humbura nga pasojat e drejtpërdrejta të
            dhunës së luftës.
          </p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Hero Card: Total Records */}
        <div className="md:col-span-4 lg:col-span-3">
          <StatCard
            title="Totali i Rekordeve"
            value={stats.totals.records}
            icon={<FileText className="h-6 w-6" />}
            description="Të vrarë, të zhdukur dhe vdekje të tjera."
            highlight
            className="h-full"
          />
        </div>

        {/* Status & Vulnerability Grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:col-span-8 lg:col-span-9 lg:grid-cols-3">
          <StatCard
            title="Civilë"
            value={civilianCount}
            icon={<Users className="h-5 w-5" />}
            description="Individë jashtë formacioneve të armatosura."
          />
          <StatCard
            title="Të Armatosur"
            value={armedCount}
            icon={<Shield className="h-5 w-5" />}
            description="Pjesëtarë të identifikuar të formacioneve."
          />
          <StatCard
            title="Të Mitur (<18)"
            value={stats.ageInsights.minorsUnder18}
            icon={<PersonStanding className="h-5 w-5" />}
            description="Fëmijë dhe adoleshentë nën moshën 18 vjeçare."
          />
        </div>
      </div>

      {/* Age Specifics - Secondary Row */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="rounded-full bg-background p-2 shadow-sm">
            <Baby className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Foshnje (0-4)
            </p>
            <p className="text-xl font-semibold">
              {formatCount(stats.ageInsights.toddlers)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="rounded-full bg-background p-2 shadow-sm">
            <Armchair className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Të moshuar (65+)
            </p>
            <p className="text-xl font-semibold">
              {formatCount(stats.ageInsights.seniors65Plus)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="rounded-full bg-background p-2 shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center font-bold text-xs text-muted-foreground">
              Ø
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Mosha Mesatare
            </p>
            <p className="text-xl font-semibold">
              {stats.ageInsights.average}{" "}
              <span className="text-sm font-normal">vjeç</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="rounded-full bg-background p-2 shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center font-bold text-xs text-muted-foreground">
              M
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Mosha Mediane
            </p>
            <p className="text-xl font-semibold">
              {stats.ageInsights.median}{" "}
              <span className="text-sm font-normal">vjeç</span>
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Content Split */}
      <div className="grid gap-10 lg:grid-cols-12">
        {/* LEFT COLUMN: Demographics & Categories (7 cols) */}
        <div className="space-y-10 lg:col-span-7">
          {/* Violation Categories */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Krimet e Raportuara
              </h2>
              <p className="text-sm text-muted-foreground">
                Kategoritë sipas Kosovo Memory Book (HLC): vrasje, zhdukje dhe
                vdekje.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.violationBreakdown.map((entry) => (
                <Card key={entry.value} className="overflow-hidden pt-0">
                  <div className="h-1 w-full bg-primary/80" />
                  <CardContent className="px-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {formatLabel(entry.value)}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">
                      {formatCount(entry.count)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Demographics (Side by Side) */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Demografia
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Shpërndarja sipas identiteteve të raportuara.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Ethnicity List */}
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" /> Etniciteti
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-5">
                  {stats.ethnicityBreakdown.slice(0, 6).map((entry) => (
                    <ProgressBar
                      key={entry.value}
                      value={entry.value}
                      count={entry.count}
                      total={totalEthnicity}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Gender List */}
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PersonStanding className="w-4 h-4" /> Gjinia
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-5">
                  {stats.genderBreakdown.map((entry) => (
                    <ProgressBar
                      key={entry.value}
                      value={entry.value}
                      label={
                        entry.value === "m"
                          ? "Meshkuj"
                          : entry.value === "f"
                            ? "Femra"
                            : "Tjetër"
                      }
                      count={entry.count}
                      total={totalGender}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Geography & Timeline (5 cols) */}
        <div className="space-y-8 lg:col-span-5">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs uppercase font-medium tracking-wide">
                  Kronologjia
                </span>
              </div>
              <CardTitle className="text-lg">Vitet më të përgjakshme</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {stats.incidentYearBreakdown.slice(0, 5).map((entry) => (
                  <li
                    key={`year-${entry.value}`}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {formatLabel(entry.value)}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-foreground">
                      {formatCount(entry.count)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Geography */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs uppercase font-medium tracking-wide">
                  Gjeografia
                </span>
              </div>
              <CardTitle className="text-lg">Komunat më të prekura</CardTitle>
              <CardDescription>Sipas vendit të incidentit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topMunicipalities.map((entry) => (
                <div key={entry.value} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {formatLabel(entry.value)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCount(entry.count)}
                    </span>
                  </div>
                  {/* Relative bar relative to the max count in the list, not total */}
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-slate-500"
                      style={{
                        width: `${(entry.count / maxMuniCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visualization Footer */}
      <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Shpërndarja e detajuar sipas moshës
            </h2>
            <p className="text-sm text-muted-foreground">
              Vizualizimi i dendësisë së viktimave bazuar në moshën gjatë
              incidentit.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium">
              Mosha min: {stats.ageInsights.min} / max: {stats.ageInsights.max}
            </div>
          </div>
        </div>
        <div className="pt-4">
          <AgeDistributionPlot data={stats.ageBreakdown} />
        </div>
      </div>
    </section>
  );
}
