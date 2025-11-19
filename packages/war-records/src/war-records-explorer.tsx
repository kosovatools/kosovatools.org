"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import { createDatasetFetcher } from "@workspace/dataset-api";
import { VictimList } from "./components/victim-list";
import type { MemorialVictim } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Field, FieldContent } from "@workspace/ui/components/field";
import { Progress } from "@workspace/ui/components/progress";

const DATASET_PREFIX = ["war"] as const;
const fetchWarDataset = createDatasetFetcher(DATASET_PREFIX, {
  defaultInit: { cache: "no-store" },
  label: "war-records",
});
const WAR_RECORDS_QUERY_KEY = ["war-records-victims"] as const;

const CHUNK_FILE_PREFIX = "deaths-part";

function buildChunkFilename(page: number): string {
  const suffix = page.toString().padStart(2, "0");
  return `${CHUNK_FILE_PREFIX}-${suffix}.json`;
}

type VictimChunk = {
  meta: {
    chunk: number;
    count: number;
    total: number;
    currentPage: number;
    totalPages: number;
  };
  records: MemorialVictim[];
};

async function fetchChunk(page: number): Promise<VictimChunk> {
  return fetchWarDataset<VictimChunk>(buildChunkFilename(page));
}

export function WarRecordsExplorer() {
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const queryClient = useQueryClient();

  const normalizedSearchInput = useMemo(
    () => searchInput.trim().toLocaleLowerCase("sq-AL"),
    [searchInput],
  );
  const deferredSearchQuery = useDeferredValue(normalizedSearchInput);
  const isSearching = normalizedSearchInput.length > 0;

  const {
    data,
    error,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: WAR_RECORDS_QUERY_KEY,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => fetchChunk(pageParam),
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const totalRecords = data?.pages[0]?.meta.total ?? null;
  const loadedChunks = data?.pages.length ?? 0;
  const totalChunks = data?.pages[0]?.meta.totalPages ?? null;
  const progressValue =
    hasNextPage && totalChunks && totalChunks > 0
      ? Math.min(100, (loadedChunks / totalChunks) * 100)
      : undefined;

  const handleLoadAll = useCallback(async () => {
    if (!hasNextPage || isLoadingAll || !data || data.pages.length === 0) {
      return;
    }

    const totalPages = data.pages[0]!.meta.totalPages;
    if (!totalPages) {
      return;
    }

    const nextPageToFetch = data.pages.length + 1;
    if (nextPageToFetch > totalPages) {
      return;
    }

    const remainingPages = Array.from(
      { length: totalPages - nextPageToFetch + 1 },
      (_, index) => nextPageToFetch + index,
    );
    if (remainingPages.length === 0) {
      return;
    }

    setIsLoadingAll(true);
    try {
      const newChunks = await Promise.all(
        remainingPages.map((page) => fetchChunk(page)),
      );

      queryClient.setQueryData<InfiniteData<VictimChunk, number>>(
        WAR_RECORDS_QUERY_KEY,
        (currentData) => {
          if (!currentData) {
            return currentData;
          }

          return {
            pages: [...currentData.pages, ...newChunks],
            pageParams: [...currentData.pageParams, ...remainingPages],
          };
        },
      );
    } catch (loadAllError) {
      console.error("[WarRecords] Failed to load all chunks", loadAllError);
    } finally {
      setIsLoadingAll(false);
    }
  }, [data, hasNextPage, isLoadingAll, queryClient]);

  const victims = useMemo(
    () => data?.pages.flatMap((page) => page.records) ?? [],
    [data],
  );

  const searchableVictims = useMemo(() => {
    return victims.map((victim) => {
      const haystack = [
        victim.fullName,
        victim.placeOfIncident,
        victim.placeOfBirth,
        victim.violation,
      ]
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value) => value.trim().toLocaleLowerCase("sq-AL"))
        .join(" ");

      return { victim, haystack };
    });
  }, [victims]);

  const filteredVictims = useMemo(() => {
    if (!deferredSearchQuery) {
      return victims;
    }

    return searchableVictims
      .filter((entry) => entry.haystack.includes(deferredSearchQuery))
      .map((entry) => entry.victim);
  }, [searchableVictims, deferredSearchQuery, victims]);

  const canAutoLoadMore = hasNextPage && !isLoadingAll;

  if (status === "pending" && victims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lista e emrave</CardTitle>
          <CardDescription>
            Po përgatitet lista e plotë. Mund të zgjasë disa sekonda.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle>Lista e emrave nuk u ngarkua</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Ndodhi një gabim gjatë shkarkimit të të dhënave."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-col gap-4 items-center md:flex-row md:items-end md:justify-between">
        <Field className="w-full max-w-md">
          <FieldContent>
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                id="war-records-search"
                type="search"
                placeholder="Kërko sipas emrit, komunës ose identitetit"
                value={searchInput}
                onChange={(event) => {
                  void handleLoadAll();
                  setSearchInput(event.target.value);
                }}
                className="pl-9"
              />
            </div>
          </FieldContent>
        </Field>

        <div className="text-right text-sm text-muted-foreground">
          <span>
            Burimi:{" "}
            <a
              href="https://www.kosovomemorybook.org/"
              className="text-primary underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Kosovo Memory Book
            </a>
            {" / "}
            <a
              href="https://www.hlc-kosovo.org/en"
              className="text-muted-primary underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Humanitarian Law Center (HLC)
            </a>
          </span>
        </div>
      </header>
      {isSearching && hasNextPage ? (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground mx-auto items-center px-5">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              Po ngarkojmë të gjithë arkivin që kërkimi të jetë i plotë…
            </span>
          </div>
          {isLoadingAll ? (
            <Progress value={progressValue} className="max-w-sm" />
          ) : null}
        </div>
      ) : null}
      <VictimList
        victims={filteredVictims}
        totalRecords={totalRecords}
        hasMore={canAutoLoadMore}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={
          canAutoLoadMore
            ? () => {
                void fetchNextPage();
              }
            : undefined
        }
      />
    </div>
  );
}
