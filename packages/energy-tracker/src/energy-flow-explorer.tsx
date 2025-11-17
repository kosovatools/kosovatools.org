"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { DailyFlowChart } from "./charts/energy-flow-daily-chart";
import { MonthlyFlowTrendChart } from "./charts/energy-flow-monthly-trend-chart";
import { loadDailyDataset, loadMonthlyDataset } from "./flow-service";
import { formatTimestamp } from "./date-formatters";
import type { EnergyDailyDatasetView, EnergyMonthlyDatasetView } from "./types";
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
import { Separator } from "@workspace/ui/components/separator";
import { getDatasetCoverageLabel } from "@workspace/kas-data";

export function EnergyFlowExplorer() {
  return (
    <React.Suspense fallback={<EnergyFlowExplorerLoadingFallback />}>
      <EnergyFlowExplorerErrorBoundary>
        <EnergyFlowExplorerContent />
      </EnergyFlowExplorerErrorBoundary>
    </React.Suspense>
  );
}

function EnergyFlowExplorerContent() {
  const { data: monthlyDataset } = useSuspenseQuery<
    EnergyMonthlyDatasetView,
    Error
  >({
    queryKey: ["energy-flow", "monthly-dataset"],
    queryFn: loadMonthlyDataset,
    staleTime: Infinity,
  });

  const { data: dailyDataset } = useSuspenseQuery<
    EnergyDailyDatasetView | null,
    Error
  >({
    queryKey: ["energy-flow", "daily-dataset"],
    queryFn: async () => {
      try {
        return await loadDailyDataset();
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    staleTime: Infinity,
  });

  const coverageLabel = React.useMemo(
    () => getDatasetCoverageLabel(monthlyDataset.meta),
    [monthlyDataset.meta],
  );
  const generatedLabel = React.useMemo(
    () => formatTimestamp(monthlyDataset.meta.generated_at ?? null),
    [monthlyDataset.meta.generated_at],
  );

  return (
    <article className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Trendi i flukseve mujore</CardTitle>
          <CardDescription>
            Analizo importet, eksportet dhe bilancin neto të energjisë elektrike
            të Kosovës përgjatë periudhave të disponueshme nga ENTSO-E.
          </CardDescription>
          <div className="text-xs text-muted-foreground">
            {coverageLabel ? <p>Mbulesa: {coverageLabel}</p> : null}
            {generatedLabel ? (
              <p>Indeksi i përditësuar më {generatedLabel}</p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <MonthlyFlowTrendChart dataset={monthlyDataset} />
        </CardContent>
      </Card>

      <DailySection dataset={dailyDataset} />
    </article>
  );
}

function DailySection({ dataset }: { dataset: EnergyDailyDatasetView | null }) {
  if (!dataset || !dataset.records.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Modeli ditor i flukseve</CardTitle>
          <CardDescription>
            Nuk ka ende të dhëna ditore për periudhën më të fundit.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const coverageLabel = getDatasetCoverageLabel(dataset.meta);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modeli ditor i importeve dhe eksporteve</CardTitle>
        {coverageLabel ? (
          <p className="text-xs text-muted-foreground">
            Mbulesa: {coverageLabel}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <DailyFlowChart dataset={dataset} />
        <Separator />
        <p className="text-xs text-muted-foreground">
          Të dhënat ditore publikohen vetëm për muajin më të fundit të procesuar
          nga ENTSO-E Transparency Platform.
        </p>
      </CardContent>
    </Card>
  );
}

function EnergyFlowExplorerLoadingFallback() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30">
      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <p>Duke u ngarkuar flukset e energjisë…</p>
      </div>
    </div>
  );
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
        <Alert variant="destructive">
          <AlertTitle>Nuk u ngarkuan të dhënat</AlertTitle>
          <AlertDescription>
            {this.state.error.message || "Ndodhi një gabim i papritur."}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
