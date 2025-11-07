"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { CustomsDataService } from "./database";
import type { CustomsTreeNode, InitializationProgress } from "./types";

import { createCustomsColumns } from "./customs-table/columns";
import { VirtualizedTreeTable } from "./virtualized-tree-table";

type DatasetValidity = {
  iso: string;
  display: string;
};

const datasetDateFormatter = new Intl.DateTimeFormat("sq-AL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

export function CustomsExplorer() {
  const [treeData, setTreeData] = useState<CustomsTreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [idQuery, setIdQuery] = useState<string>("");
  const [descQuery, setDescQuery] = useState<string>("");
  const [codeFilterOpen, setCodeFilterOpen] = useState(false);
  const [descFilterOpen, setDescFilterOpen] = useState(false);
  const [indexingState, setIndexingState] =
    useState<InitializationProgress | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [datasetValidity, setDatasetValidity] =
    useState<DatasetValidity | null>(null);
  const [isPending, startTransition] = useTransition();
  const mountedRef = useRef(true);

  const debouncedId = useDebouncedValue(idQuery.trim(), 250);
  const normalizedDescQuery = descQuery.trim();
  const debouncedDesc = useDebouncedValue(
    normalizedDescQuery.length >= 3 ? normalizedDescQuery : "",
    250,
  );
  const codePrefix = debouncedId;
  const toggleCodeFilter = useCallback(
    () => setCodeFilterOpen((previous) => !previous),
    [],
  );
  const toggleDescFilter = useCallback(
    () => setDescFilterOpen((previous) => !previous),
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
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
                display: datasetDateFormatter.format(latestValidFromDate),
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

    (async () => {
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
        codePrefix,
        idQuery,
        onIdQueryChange: setIdQuery,
        descQuery,
        onDescQueryChange: setDescQuery,
        isCodeFilterOpen: codeFilterOpen,
        onToggleCodeFilter: toggleCodeFilter,
        isDescFilterOpen: descFilterOpen,
        onToggleDescFilter: toggleDescFilter,
      }),
    [
      codeFilterOpen,
      codePrefix,
      descFilterOpen,
      descQuery,
      idQuery,
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
    <Card className="overflow-hidden gap-0 py-0 border-b-0 rounded-b-none">
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
              <p>
                Data tregon vlerën më të fundit të fushës{" "}
                <span className="font-mono">E vlefshme nga</span> në datasetin{" "}
                <span className="font-mono">customs/tarrifs.json</span> të
                publikuar nga Dogana e Kosovës.
              </p>
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
