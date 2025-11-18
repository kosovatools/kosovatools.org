"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
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

export function BuildingPermitExplorer() {
  const {
    data: index,
    isLoading: isIndexLoading,
    isError: isIndexError,
    error: indexError,
  } = useQuery({
    queryKey: ["prishtina-building-permits", "index"],
    queryFn: loadBuildingPermitsIndex,
    staleTime: Infinity,
  });

  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    return index?.years[0]?.year ?? new Date().getFullYear();
  });

  React.useEffect(() => {
    if (!index?.years.length) {
      return;
    }
    setSelectedYear((current) => {
      if (index?.years.some((entry) => entry.year === current)) {
        return current;
      }
      return index?.years[0]?.year ?? current;
    });
  }, [index?.years]);

  const selectedSummary = index?.years.find(
    (entry) => entry.year === selectedYear,
  );

  const {
    data: dataset,
    isLoading: isDatasetLoading,
    isError: isDatasetError,
    error: datasetError,
  } = useQuery({
    queryKey: [
      "prishtina-building-permits",
      "dataset",
      selectedSummary?.records_file,
    ],
    queryFn: () => loadBuildingPermitsYear(selectedSummary!.records_file),
    staleTime: Infinity,
    enabled: !!selectedSummary,
  });

  if (isIndexError) {
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
            {indexError?.message || "Ndodhi një gabim i papritur."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isDatasetError) {
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
            {datasetError?.message || "Ndodhi një gabim i papritur."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isIndexLoading || !index) {
    return <ExplorerLoadingFallback />;
  }

  if (!selectedSummary) {
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

  if (isDatasetLoading || !dataset) {
    return <ExplorerLoadingFallback />;
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
      <PermitFiltersCard dataset={dataset} selectedSummary={selectedSummary} />
    </div>
  );
}
