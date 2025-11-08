"use client";

import * as React from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { loadBuildingPermitsIndex, loadBuildingPermitsYear } from "../api";
import { DatasetSummaryCard } from "./building-permit-explorer/dataset-summary-card";
import { PermitFiltersCard } from "./building-permit-explorer/permit-filters-card";

export type BuildingPermitExplorerProps = {
  defaultYear?: number;
};

export function BuildingPermitExplorer(
  props: BuildingPermitExplorerProps = {},
) {
  return (
    <React.Suspense fallback={<ExplorerLoadingFallback />}>
      <ExplorerErrorBoundary>
        <BuildingPermitExplorerContent {...props} />
      </ExplorerErrorBoundary>
    </React.Suspense>
  );
}

function ExplorerLoadingFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Po përgatisim lejet e ndërtimit</CardTitle>
        <CardDescription>
          Të dhënat e Komunës së Prishtinës do të shfaqen për pak çaste.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

class ExplorerErrorBoundary extends React.Component<
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
            <CardTitle>Nuk u ngarkuan lejet e ndërtimit</CardTitle>
            <CardDescription>
              Kontakto lidhjen me internetin dhe provo të rifreskosh faqen.
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

function BuildingPermitExplorerContent({
  defaultYear,
}: BuildingPermitExplorerProps) {
  const { data: index } = useSuspenseQuery({
    queryKey: ["prishtina-building-permits", "index"],
    queryFn: loadBuildingPermitsIndex,
    staleTime: Infinity
  });


  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    if (defaultYear) {
      const candidate = index.years.find((entry) => entry.year === defaultYear);
      if (candidate) {
        return candidate.year;
      }
    }
    return index.years[0]?.year ?? new Date().getFullYear();
  });

  React.useEffect(() => {
    if (!index.years.length) {
      return;
    }
    setSelectedYear((current) => {
      if (index.years.some((entry) => entry.year === current)) {
        return current;
      }
      if (defaultYear) {
        const fallback = index.years.find(
          (entry) => entry.year === defaultYear,
        );
        if (fallback) {
          return fallback.year;
        }
      }
      return index.years[0]?.year ?? current;
    });
  }, [(index.years), defaultYear]);

  const selectedSummary = index.years.find((entry) => entry.year === selectedYear)



  const { data: dataset } = useQuery({
    queryKey: [
      "prishtina-building-permits",
      "dataset",
      selectedSummary?.records_file,
    ],
    queryFn: () =>
      loadBuildingPermitsYear(
        selectedSummary!.records_file
      ),
    staleTime: Infinity,
    enabled: !!selectedSummary
  });

  if (!dataset || !selectedSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nuk ka të dhëna të publikuara</CardTitle>
          <CardDescription>
            Prit identifikimin e parë të të dhënave për lejet e ndërtimit.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <DatasetSummaryCard
        index={index}
        dataset={dataset}
        selectedSummary={selectedSummary}
        onYearChange={setSelectedYear}
        sortedYears={index.years}
      />
      <PermitFiltersCard
        dataset={dataset}
        selectedSummary={selectedSummary}
      />
    </div>
  );
}
