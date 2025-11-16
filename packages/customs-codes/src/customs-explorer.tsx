"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { CustomsDataService } from "./database";
import type { CustomsTreeNode, InitializationProgress } from "./types";
import { formatDate } from "@workspace/utils";

import { createCustomsColumns } from "./customs-table/columns";
import { VirtualizedTreeTable } from "./virtualized-tree-table";
import { useCustomsSearchState } from "./use-customs-search-state";

type DatasetValidity = {
  iso: string;
  display: string;
};

export function CustomsExplorer() {
  const [treeData, setTreeData] = useState<CustomsTreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [indexingState, setIndexingState] =
    useState<InitializationProgress | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [datasetValidity, setDatasetValidity] =
    useState<DatasetValidity | null>(null);
  const [isPending, startTransition] = useTransition();
  const mountedRef = useRef(true);

  const {
    setIdQuery,
    setDescQuery,
    codeFilterOpen,
    toggleCodeFilter,
    descFilterOpen,
    toggleDescFilter,
    debouncedId,
    debouncedDesc,
    getIdQuery,
    getDescQuery,
    getCodePrefix,
  } = useCustomsSearchState();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      try {
        await CustomsDataService.initializeData({
          force: false,
          onProgress: (progress) => {
            if (progress.phase === "done" || progress.phase === "cached") {
              setIndexingState(null);
              return;
            }
            setIndexingState(progress);
          },
        });

        const all = await CustomsDataService.getAllData();
        const latestValidFromDate =
          await CustomsDataService.getLatestValidFromDate(all);
        if (!mountedRef.current) return;
        startTransition(() => {
          setTreeData(CustomsDataService.buildTreeFromList(all));
          setDatasetValidity(
            latestValidFromDate
              ? {
                  iso: latestValidFromDate.toISOString(),
                  display: formatDate(
                    latestValidFromDate,
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                    { fallback: "—", preserveInputOnInvalid: false },
                  ),
                }
              : null,
          );
          setInitialized(true);
        });
      } catch (error) {
        console.error("Failed to initialize customs data:", error);
        if (!mountedRef.current) return;
        setIndexingState((current) =>
          current && current.phase === "error"
            ? current
            : {
                phase: "error",
                loaded: 0,
                total: 0,
                message: "Indeksimi dështoi. Kontrolloni konsolën për detaje.",
              },
        );
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [startTransition]);

  useEffect(() => {
    if (!initialized) return;
    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);

        const idPref = debouncedId;
        const desc = debouncedDesc;

        const nextList =
          !idPref && !desc
            ? await CustomsDataService.getAllData()
            : await CustomsDataService.searchByFields(idPref, desc);

        if (cancelled || !mountedRef.current) return;
        startTransition(() => {
          setTreeData(CustomsDataService.buildTreeFromList(nextList));
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedId, debouncedDesc, initialized, startTransition]);

  const columns = useMemo(
    () =>
      createCustomsColumns({
        getCodePrefix,
        getIdQuery,
        onIdQueryChange: setIdQuery,
        getDescQuery,
        onDescQueryChange: setDescQuery,
        isCodeFilterOpen: codeFilterOpen,
        onToggleCodeFilter: toggleCodeFilter,
        isDescFilterOpen: descFilterOpen,
        onToggleDescFilter: toggleDescFilter,
      }),
    [
      codeFilterOpen,
      descFilterOpen,
      getCodePrefix,
      getDescQuery,
      getIdQuery,
      setDescQuery,
      setIdQuery,
      toggleCodeFilter,
      toggleDescFilter,
    ],
  );

  const progressPercent =
    indexingState && indexingState.total > 0
      ? Math.min(
          100,
          Math.round((indexingState.loaded / indexingState.total) * 100),
        )
      : null;

  return (
    <Card className="overflow-hidden gap-0 py-0">
      <CardContent className="p-0 ">
        {indexingState ? (
          <div className="space-y-2 border-b px-4 py-3 text-xs text-muted-foreground sm:text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>{indexingState.message}</span>
              {progressPercent !== null ? (
                <span className="font-medium text-foreground">
                  {progressPercent}%
                </span>
              ) : null}
            </div>
            {progressPercent !== null ? (
              <Progress className="h-1.5" value={progressPercent} />
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2 border-b px-4 py-3 text-xs text-muted-foreground sm:text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <span className="text-foreground text-sm font-semibold uppercase tracking-wide">
                Përditësuar së fundmi:
                <time
                  title={datasetValidity?.iso ?? "—"}
                  dateTime={datasetValidity?.iso ?? undefined}
                  className="font-medium text-foreground ml-1"
                >
                  {datasetValidity?.display ?? "—"}
                </time>
              </span>
            </div>
          </div>
        </div>

        <VirtualizedTreeTable
          columns={columns}
          data={treeData}
          loading={loading || isPending}
          autoExpandAll
        />
      </CardContent>
    </Card>
  );
}
