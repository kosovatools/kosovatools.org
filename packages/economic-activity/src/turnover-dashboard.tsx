"use client";

import * as React from "react";
import {
  useSuspenseQuery,
  type UseSuspenseQueryResult,
} from "@tanstack/react-query";

import {
  fetchCategoriesDataset,
  fetchCitiesDataset,
  fetchCityCategoryYearlyDataset,
  fetchMonthlyCityCategoryDataset,
} from "./api";
import type {
  CategoriesDatasetView,
  CitiesDatasetView,
  CityCategoryYearlyDatasetView,
  MonthlyCategoryCityDatasetView,
} from "./types";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { NativeSelect } from "@workspace/ui/components/native-select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ChartContainer } from "@workspace/ui/components/chart";
import { formatCurrency, formatCount } from "@workspace/utils";

import { CategoriesOverYearsChart } from "./charts/categories-over-years-chart";
import { MonthlyCategoryStackedChart } from "./charts/monthly-category-stacked-chart";
import { TopCategoryByCityStackedChart } from "./charts/top-category-by-city-chart";
import { TurnoverByCategoryChart } from "./charts/turnover-by-category-chart";
import { TurnoverByCityChart } from "./charts/turnover-by-city-chart";

function getLatestPeriod(meta?: {
  time?: { last?: string | null };
}): string | null {
  const last = meta?.time?.last ?? null;
  if (typeof last === "string" && last.trim().length > 0) {
    return last;
  }
  return null;
}

function getLatestPeriodRecords<T extends { period: string }>(
  dataset?: {
    meta: { time: { last?: string | null } };
    records: ReadonlyArray<T>;
  } | null,
): { period: string; records: T[] } | null {
  if (!dataset) return null;
  const period = getLatestPeriod(dataset.meta);
  if (!period) return null;
  const records = dataset.records.filter((record) => record.period === period);
  if (!records.length) return null;
  return { period, records };
}

function formatPeriodRange(meta?: {
  time?: { first?: string | null; last?: string | null };
}): string | null {
  const first = meta?.time?.first ?? null;
  const last = meta?.time?.last ?? null;
  if (!first && !last) return null;
  if (!first) return last;
  if (!last) return first;
  if (first === last) return first;
  return `${first}–${last}`;
}

function parseYearFromPeriod(period: string | null | undefined): number | null {
  if (!period) return null;
  const match = /^(\d{4})/.exec(period);
  if (!match) return null;
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) ? numeric : null;
}

function TurnoverDashboardLoadingFallback() {
  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <span className="inline-flex h-6 w-32 rounded-full bg-muted" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-[520px] max-w-full" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </header>
      <section className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-3 w-48" />
            </CardFooter>
          </Card>
        ))}
      </section>
    </article>
  );
}

class TurnoverDashboardErrorBoundary extends React.Component<
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
            <CardTitle>Nuk arritëm të ngarkojmë të dhënat</CardTitle>
            <CardDescription>
              Grafiku i qarkullimit nuk është i disponueshëm aktualisht.
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

function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Shfaqja e të dhënave dështoi</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function CategorySection({
  query,
}: {
  query: UseSuspenseQueryResult<CategoriesDatasetView, Error>;
}) {
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const dataset = query.data ?? null;
  const latestRecords = React.useMemo(() => {
    if (!dataset) return [];
    return [...dataset.limit(1).records];
  }, [dataset]);
  const latestPeriod = React.useMemo(
    () => getLatestPeriod(dataset?.meta),
    [dataset],
  );
  const year = React.useMemo(
    () => parseYearFromPeriod(latestPeriod),
    [latestPeriod],
  );
  const hasData = latestRecords.length > 0;

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Qarkullimi sipas kategorive kryesore</CardTitle>
        <CardDescription>
          {year
            ? `Shuma totale vjetore e qarkullimit për kategoritë kryesore të aktivitetit ekonomik gjatë vitit ${year}.`
            : "Shuma totale vjetore e qarkullimit sipas degëve të biznesit për vitin e fundit të përditësuar."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={errorMessage} />
        ) : hasData ? (
          <TurnoverByCategoryChart records={latestRecords} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nuk ka të dhëna për kategoritë kryesore të qarkullimit.
          </p>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), llogaritje nga deklaratat e
        tatimpaguesve.
      </CardFooter>
    </React.Fragment>
  );
}

function CitySection({
  query,
}: {
  query: UseSuspenseQueryResult<CitiesDatasetView, Error>;
}) {
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const dataset = query.data ?? null;
  const latestRecords = React.useMemo(() => {
    if (!dataset) return [];
    return [...dataset.limit(1).records];
  }, [dataset]);
  const latestPeriod = React.useMemo(
    () => getLatestPeriod(dataset?.meta),
    [dataset],
  );
  const year = React.useMemo(
    () => parseYearFromPeriod(latestPeriod),
    [latestPeriod],
  );
  const hasData = latestRecords.length > 0;

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Qarkullimi sipas komunave të Kosovës</CardTitle>
        <CardDescription>
          {year
            ? `Komunat me qarkullimin më të lartë të deklaruar gjatë vitit ${year}.`
            : "Komunat me qarkullimin më të lartë për vitin e fundit në dispozicion."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={errorMessage} />
        ) : hasData ? (
          <TurnoverByCityChart records={latestRecords} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nuk ka të dhëna për komunat me qarkullimin më të lartë.
          </p>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), llogaritje nga deklaratat e
        tatimpaguesve.
      </CardFooter>
    </React.Fragment>
  );
}

function CategoryTrendSection({
  query,
}: {
  query: UseSuspenseQueryResult<CategoriesDatasetView, Error>;
}) {
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const dataset = query.data ?? null;
  const hasData = Boolean(dataset && dataset.records.length);

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Trendi shumëvjeçar i kategorive kryesore</CardTitle>
        <CardDescription>
          Krahaso qarkullimin vjetor të degëve më të mëdha të biznesit. Shifrat
          paraqiten në kolonë të grumbulluar për të parë kontributin e çdo
          kategorie përgjatë viteve.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={errorMessage} />
        ) : hasData && dataset ? (
          <CategoriesOverYearsChart dataset={dataset} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nuk ka të dhëna shumëvjeçare për t&apos;u paraqitur.
          </p>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), seritë e qarkullimit vjetor sipas
        kategorive ekonomike.
      </CardFooter>
    </React.Fragment>
  );
}

function MonthlyCategorySection({
  query,
}: {
  query: UseSuspenseQueryResult<MonthlyCategoryCityDatasetView, Error>;
}) {
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const dataset = query.data ?? null;
  const hasData = Boolean(dataset?.records.length);
  const coverageYear = dataset?.meta.coverage_year ?? null;

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Dinamika mujore e kategorive</CardTitle>
        <CardDescription>
          {coverageYear
            ? `Shiko si shpërndahet qarkullimi mujor ndërmjet kategorive kryesore gjatë vitit ${coverageYear}.`
            : "Shiko si shpërndahet qarkullimi mujor ndërmjet kategorive kryesore gjatë vitit të fundit."}{" "}
          Grafiku i grumbulluar paraqet kontributet mujore të kategorive më të
          mëdha, të agreguara nga të gjitha komunat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={errorMessage} />
        ) : dataset && hasData ? (
          <MonthlyCategoryStackedChart dataset={dataset} />
        ) : dataset ? (
          <p className="text-sm text-muted-foreground">
            Nuk ka të dhëna mujore për këtë periudhë.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nuk kemi të dhëna për të ndërtuar grafikun mujor.
          </p>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), qarkullimi mujor sipas kategorisë
        dhe komunës për vitin e fundit.
      </CardFooter>
    </React.Fragment>
  );
}

function TopCategoryByCitySection({
  query,
}: {
  query: UseSuspenseQueryResult<CityCategoryYearlyDatasetView, Error>;
}) {
  const isError = query.isError;
  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : "Provoni përsëri më vonë.";
  const citySummaries = React.useMemo(() => {
    const map = new Map<string, { turnover: number; years: Set<number> }>();
    for (const record of (query.data ?? null)?.records ?? []) {
      const periodYear = parseYearFromPeriod(record.period);
      const summary = map.get(record.city) ?? {
        turnover: 0,
        years: new Set<number>(),
      };
      summary.turnover += record.turnover;
      if (periodYear != null) {
        summary.years.add(periodYear);
      }
      map.set(record.city, summary);
    }
    return Array.from(map.entries())
      .map(([city, { turnover, years }]) => ({
        city,
        turnover,
        yearCount: years.size,
      }))
      .sort((a, b) => b.turnover - a.turnover);
  }, [query.data]);

  const [selectedCity, setSelectedCity] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!citySummaries.length) {
      setSelectedCity(null);
      return;
    }
    const first = citySummaries[0];
    if (!first) {
      setSelectedCity(null);
      return;
    }
    if (
      !selectedCity ||
      !citySummaries.some((entry) => entry.city === selectedCity)
    ) {
      setSelectedCity(first.city);
    }
  }, [citySummaries, selectedCity]);

  const filteredRecords = React.useMemo(
    () =>
      selectedCity
        ? ((query.data ?? null)?.records ?? []).filter(
            (record) => record.city === selectedCity,
          )
        : [],
    [query.data, selectedCity],
  );

  const selectedSummary = React.useMemo(() => {
    if (!selectedCity) {
      return null;
    }
    return citySummaries.find((entry) => entry.city === selectedCity) ?? null;
  }, [citySummaries, selectedCity]);

  const hasData = filteredRecords.length > 0;

  return (
    <React.Fragment>
      <CardHeader>
        <CardTitle>Kategoritë dominuese sipas komunave</CardTitle>
        <CardDescription>
          Zgjidh një komunë për të parë cilat kategori biznesi kanë dominuar
          qarkullimin në vite. Grafiku i grumbulluar tregon shpërndarjen e
          kategorive sipas qarkullimit të raportuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={errorMessage} />
        ) : !citySummaries.length ? (
          <p className="text-sm text-muted-foreground">
            Nuk ka të dhëna për kategoritë kryesuese sipas komunave.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-2">
                <Label htmlFor="economic-activity-city">Zgjidh komunën</Label>
                <NativeSelect
                  id="economic-activity-city"
                  value={selectedCity ?? ""}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedCity(
                      event.target.value ? String(event.target.value) : null,
                    )
                  }
                >
                  {citySummaries.map((entry) => (
                    <option key={entry.city} value={entry.city}>
                      {entry.city}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {selectedSummary ? (
                <div className="text-xs text-muted-foreground">
                  Totali ({selectedSummary.yearCount} vite):{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(selectedSummary.turnover)}
                  </span>
                </div>
              ) : null}
            </div>

            {(query.data ?? null) && hasData && selectedCity ? (
              <TopCategoryByCityStackedChart
                city={selectedCity}
                records={filteredRecords}
                meta={(query.data ?? null).meta}
              />
            ) : (
              <ChartContainer config={{}}>
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nuk ka të dhëna për komunën e përzgjedhur.
                </div>
              </ChartContainer>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Burimi: Ministria e Financave (MFK), kategoritë kryesore të qarkullimit
        për secilën komunë.
      </CardFooter>
    </React.Fragment>
  );
}

function TurnoverDashboardContent() {
  const categoriesQuery = useSuspenseQuery<CategoriesDatasetView, Error>({
    queryKey: ["mfk", "turnover", "categories", "dataset"],
    queryFn: fetchCategoriesDataset,
    staleTime: 6 * 60 * 1000,
  });

  const citiesQuery = useSuspenseQuery<CitiesDatasetView, Error>({
    queryKey: ["mfk", "turnover", "cities", "dataset"],
    queryFn: fetchCitiesDataset,
    staleTime: 6 * 60 * 1000,
  });

  const monthlyCategoryQuery = useSuspenseQuery<
    MonthlyCategoryCityDatasetView,
    Error
  >({
    queryKey: ["mfk", "turnover", "monthly", "category-city"],
    queryFn: fetchMonthlyCityCategoryDataset,
    staleTime: 6 * 60 * 1000,
  });

  const cityCategoryYearlyQuery = useSuspenseQuery<
    CityCategoryYearlyDatasetView,
    Error
  >({
    queryKey: ["mfk", "turnover", "city-category", "yearly"],
    queryFn: fetchCityCategoryYearlyDataset,
    staleTime: 6 * 60 * 1000,
  });

  const latestCategoryRecords = React.useMemo(
    () => getLatestPeriodRecords(categoriesQuery.data ?? null),
    [categoriesQuery.data],
  );
  const latestCityRecords = React.useMemo(
    () => getLatestPeriodRecords(citiesQuery.data ?? null),
    [citiesQuery.data],
  );
  const datasetYear = React.useMemo(() => {
    const period =
      latestCategoryRecords?.period ?? latestCityRecords?.period ?? null;
    return parseYearFromPeriod(period);
  }, [latestCategoryRecords, latestCityRecords]);

  const totalTaxpayers = React.useMemo(() => {
    if (!latestCategoryRecords) return null;
    return latestCategoryRecords.records.reduce((sum, record) => {
      return Number.isFinite(record.taxpayers) ? sum + record.taxpayers : sum;
    }, 0);
  }, [latestCategoryRecords]);

  const totalCitiesReported = latestCityRecords?.records.length ?? 0;

  const yearRangeLabel = React.useMemo(() => {
    return formatPeriodRange(categoriesQuery.data?.meta);
  }, [categoriesQuery.data]);

  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          Aktivitet ekonomik
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Qarkullimi i bizneseve në Kosovë
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Vizualizime të qarkullimit sipas degëve ekonomike dhe komunave për të
          kuptuar ku përqëndrohen bizneset që gjenerojnë më shumë të ardhura.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {datasetYear ? <span>Viti i referencës: {datasetYear}</span> : null}
          {totalTaxpayers !== null ? (
            <span>Tatimpagues në total: {formatCount(totalTaxpayers)}</span>
          ) : null}
          {yearRangeLabel ? (
            <span>Periudha e mbuluar: {yearRangeLabel}</span>
          ) : null}
          {totalCitiesReported ? (
            <span>Komuna të mbuluara: {totalCitiesReported}</span>
          ) : null}
        </div>
      </header>

      <section className="space-y-6">
        <Card>
          <CategorySection query={categoriesQuery} />
        </Card>
        <Card>
          <CitySection query={citiesQuery} />
        </Card>
        <Card>
          <MonthlyCategorySection query={monthlyCategoryQuery} />
        </Card>

        <Card>
          <CategoryTrendSection query={categoriesQuery} />
        </Card>
        <Card>
          <TopCategoryByCitySection query={cityCategoryYearlyQuery} />
        </Card>
      </section>
    </article>
  );
}

export function TurnoverDashboard() {
  return (
    <React.Suspense fallback={<TurnoverDashboardLoadingFallback />}>
      <TurnoverDashboardErrorBoundary>
        <TurnoverDashboardContent />
      </TurnoverDashboardErrorBoundary>
    </React.Suspense>
  );
}
