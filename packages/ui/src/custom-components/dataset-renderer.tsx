import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";
import {
  formatGeneratedAt,
  GenericDataset,
  getDatasetCoverageLabel,
} from "@workspace/kas-data";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { ChartEmptyState } from "@workspace/ui/components/chart";

type SuspenseQueryLike<TData> = {
  data: TData | undefined;
  error: unknown;
  isError: boolean;
  isLoading?: boolean;
};

// Props when using dataset directly
type DatasetRendererPropsWithDataset<TDataset> = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  dataset: TDataset;
  query?: never;
  children: React.ReactNode | ((dataset: TDataset) => React.ReactNode);
  isEmpty?: (dataset: TDataset) => boolean;
  emptyStateContent?: React.ReactNode;
  className?: string;
  id?: string;
};

// Props when using query
type DatasetRendererPropsWithQuery<TDataset> = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  dataset?: never;
  query: SuspenseQueryLike<TDataset>;
  children: React.ReactNode | ((dataset: TDataset) => React.ReactNode);
  isEmpty?: (dataset: TDataset) => boolean;
  emptyStateContent?: React.ReactNode;
  className?: string;
  id?: string;
};

export type DatasetRendererProps<TDataset> =
  | DatasetRendererPropsWithDataset<TDataset>
  | DatasetRendererPropsWithQuery<TDataset>;

const DEFAULT_ERROR_TITLE = "Shfaqja e të dhëna dështoi";
const DEFAULT_ERROR_MESSAGE = "Provoni përsëri më vonë.";
const DEFAULT_LOADING_MESSAGE = "Të dhënat po ngarkohen...";
const DEFAULT_EMPTY_MESSAGE = "Nuk ka të dhëna për t'u shfaqur.";

export function DatasetRenderer<TDataset extends GenericDataset>({
  title,
  description,
  dataset,
  query,
  children,
  isEmpty = (ds) => ds.records.length === 0,
  emptyStateContent,
  className,
  id,
}: DatasetRendererProps<TDataset>) {
  // Handle query-based loading
  if (query) {
    const isLoading =
      query.isLoading ?? (typeof query.data === "undefined" && !query.isError);

    if (query.isError) {
      const message =
        query.error instanceof Error && query.error.message
          ? query.error.message
          : DEFAULT_ERROR_MESSAGE;
      return (
        <Alert variant="destructive">
          <AlertTitle>{DEFAULT_ERROR_TITLE}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      );
    }

    if (isLoading) {
      return (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          {DEFAULT_LOADING_MESSAGE}
        </div>
      );
    }

    // Use query data as dataset
    dataset = query.data as TDataset;
  }

  const resolvedDataset = dataset;

  const isDatasetEmpty = resolvedDataset ? isEmpty(resolvedDataset) : false;

  // Check for empty state
  if (isDatasetEmpty) {
    return (
      <ChartEmptyState
        messageContent={emptyStateContent ?? DEFAULT_EMPTY_MESSAGE}
      />
    );
  }

  // At this point, dataset is guaranteed to be defined
  if (!resolvedDataset) {
    return null;
  }

  const hasHeader = Boolean(title || description);

  const coverageLabel = getDatasetCoverageLabel(resolvedDataset.meta);
  const footerSegments = [
    `Burimi: ${resolvedDataset.meta.source}.`,
    `Gjeneruar më ${formatGeneratedAt(resolvedDataset.meta.generated_at)}`,
  ];

  if (coverageLabel) {
    footerSegments.push(`Periudha: ${coverageLabel}`);
  }

  const footerText = footerSegments.join(" · ");

  // Render children - support both render prop and normal children
  const renderedChildren =
    typeof children === "function" ? children(resolvedDataset) : children;

  return (
    <section id={id} className={cn("space-y-4", className)}>
      {hasHeader ? (
        <div className="space-y-2">
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
      ) : null}

      {renderedChildren}

      {footerText ? (
        <div className="text-xs text-muted-foreground">{footerText}</div>
      ) : null}
    </section>
  );
}
