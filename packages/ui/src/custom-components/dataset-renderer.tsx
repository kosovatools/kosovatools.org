"use client";
import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";
import {
  createDataset,
  DatasetView,
  formatGeneratedAt,
  GenericDataset,
  getDatasetCoverageLabel,
} from "@workspace/data";
import { Button } from "@workspace/ui/components/button";
import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { ChartEmptyState } from "@workspace/ui/components/chart";

type RendererChildren<TDataset extends GenericDataset> =
  | React.ReactNode
  | ((dataset: DatasetView<TDataset>) => React.ReactNode);

type DatasetRendererQueryOptions<TDataset extends GenericDataset> = Omit<
  UseQueryOptions<TDataset, Error, TDataset, QueryKey>,
  "queryKey" | "queryFn" | "initialData"
>;

export type DatasetRendererProps<TDataset extends GenericDataset> = {
  title: React.ReactNode;
  description?: React.ReactNode;
  datasetLoader: () => Promise<TDataset>;
  queryKey: QueryKey;
  initialData?: TDataset;
  queryOptions?: DatasetRendererQueryOptions<TDataset>;
  children: RendererChildren<TDataset>;
  isEmpty?: (dataset: DatasetView<TDataset>) => boolean;
  emptyStateContent?: React.ReactNode;
  className?: string;
  id?: string;
};

const DEFAULT_ERROR_TITLE = "Shfaqja e të dhëna dështoi";
const DEFAULT_ERROR_MESSAGE = "Provoni përsëri më vonë.";
const DEFAULT_LOADING_MESSAGE = "Të dhënat po ngarkohen...";
const DEFAULT_EMPTY_MESSAGE = "Nuk ka të dhëna për t'u shfaqur.";

export function DatasetRenderer<TDataset extends GenericDataset>({
  title,
  description,
  datasetLoader,
  queryKey,
  initialData,
  queryOptions,
  children,
  isEmpty = (ds) => ds.records.length === 0,
  emptyStateContent,
  className,
  id,
}: DatasetRendererProps<TDataset>) {
  const queryResult = useQuery<TDataset, Error>({
    queryKey,
    queryFn: datasetLoader,
    initialData,
    staleTime: Infinity,
    ...queryOptions,
  });

  const isLoading =
    queryResult.isLoading &&
    (typeof queryResult.data === "undefined" || queryResult.data === null);
  const isRefetching = queryResult.isFetching && !isLoading;

  const refreshButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void queryResult.refetch()}
      disabled={isLoading || isRefetching}
      className="gap-2"
      aria-label="Rifresko të dhënat"
    >
      <RotateCw
        aria-hidden
        className={cn(
          "h-4 w-4",
          isRefetching ? "animate-spin text-primary" : "text-muted-foreground",
        )}
      />
    </Button>
  );

  const headerContent = (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          {typeof title === "string" ? (
            <h2 className="text-2xl font-semibold tracking-tight">
              {id ? (
                <a
                  href={`#${id}`}
                  className="hover:underline decoration-muted-foreground/50 underline-offset-4"
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </h2>
          ) : (
            title
          )}
          {typeof description === "string" ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : (
            description
          )}
        </div>
        <div className="flex shrink-0 justify-end">{refreshButton}</div>
      </div>
    </div>
  );

  const hydratedDataset = React.useMemo(
    () =>
      queryResult.data
        ? (createDataset(queryResult.data) as DatasetView<TDataset>)
        : undefined,
    [queryResult.data],
  );

  if (queryResult.isError && !hydratedDataset) {
    const message =
      queryResult.error instanceof Error && queryResult.error.message
        ? queryResult.error.message
        : DEFAULT_ERROR_MESSAGE;
    return (
      <section id={id} className={cn("space-y-4", className)}>
        {headerContent}
        <Alert variant="destructive">
          <AlertTitle>{DEFAULT_ERROR_TITLE}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id={id} className={cn("space-y-4", className)}>
        {headerContent}
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          {DEFAULT_LOADING_MESSAGE}
        </div>
      </section>
    );
  }

  const isDatasetEmpty = hydratedDataset ? isEmpty(hydratedDataset) : false;

  // Check for empty state
  if (isDatasetEmpty) {
    return (
      <section id={id} className={cn("space-y-4", className)}>
        {headerContent}
        <ChartEmptyState
          messageContent={emptyStateContent ?? DEFAULT_EMPTY_MESSAGE}
        />
      </section>
    );
  }

  // At this point, dataset is guaranteed to be defined
  if (!hydratedDataset) {
    return null;
  }

  const coverageLabel = getDatasetCoverageLabel(hydratedDataset.meta);
  const footerSegments = [
    `Burimi: ${hydratedDataset.meta.source}.`,
    `Gjeneruar më ${formatGeneratedAt(hydratedDataset.meta.generated_at)}`,
  ];

  if (coverageLabel) {
    footerSegments.push(`Periudha: ${coverageLabel}`);
  }

  const footerText = footerSegments.join(" · ");

  // Render children - support both render prop and normal children
  const renderedChildren =
    typeof children === "function" ? children(hydratedDataset) : children;

  return (
    <section id={id} className={cn("space-y-4", className)}>
      {headerContent}

      {renderedChildren}

      {footerText ? (
        <div className="text-xs text-muted-foreground">{footerText}</div>
      ) : null}
    </section>
  );
}
