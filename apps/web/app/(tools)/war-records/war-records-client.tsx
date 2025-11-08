"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { createDatasetApi } from "@workspace/dataset-api";
import { VictimList, type MemorialVictim } from "@workspace/war-records";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";

const warRecordsDataset = createDatasetApi({
  prefix: "war",
  defaultInit: { cache: "no-store" },
});

const FIRST_CHUNK_PAGE = 1;
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

async function fetchChunk(
  page: number = FIRST_CHUNK_PAGE,
): Promise<VictimChunk> {
  const target = buildChunkFilename(page);

  const payload = await warRecordsDataset.fetchJson<VictimChunk>(target);
  if (
    !payload?.meta ||
    typeof payload.meta.currentPage !== "number" ||
    typeof payload.meta.totalPages !== "number" ||
    !Array.isArray(payload.records)
  ) {
    throw new Error(`Formati i papritur për ${target}`);
  }

  return payload;
}

export function WarRecordsClient() {
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [searchInput, setSearchInput] = useState("");

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
    queryKey: ["war-records-victims"],
    initialPageParam: FIRST_CHUNK_PAGE,
    queryFn: async ({ pageParam }) =>
      fetchChunk((pageParam as number | undefined) ?? FIRST_CHUNK_PAGE),
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const victims = useMemo(
    () =>
      data?.pages.flatMap((page) => page.records).filter(Boolean) ??
      ([] as MemorialVictim[]),
    [data],
  );

  const totalRecords = data?.pages[0]?.meta.total ?? null;

  const handleLoadAll = useCallback(async () => {
    if (!hasNextPage || isLoadingAll) {
      return;
    }

    setIsLoadingAll(true);
    try {
      let hasMore = true;
      while (hasMore) {
        const result = await fetchNextPage();
        hasMore = result.hasNextPage ?? false;
      }
    } finally {
      setIsLoadingAll(false);
    }
  }, [fetchNextPage, hasNextPage, isLoadingAll]);

  useEffect(() => {
    if (!isSearching || !hasNextPage || isLoadingAll) {
      return;
    }

    void handleLoadAll();
  }, [handleLoadAll, hasNextPage, isLoadingAll, isSearching]);

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
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Emrat e dokumentuar
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Lista mbahet nga Kosovo Memory Book e kuruar nga Humanitarian Law
          Center. Fillimisht ngarkohen 100 emra dhe pjesa tjetër shfaqet teksa
          lëvizni ose kërkoni në arkiv.
        </p>
        <div className="max-w-md space-y-2">
          <label
            htmlFor="war-records-search"
            className="text-sm font-medium text-foreground"
          >
            Kërko në listë
          </label>
          <Input
            id="war-records-search"
            type="search"
            placeholder="Shkruaj emrin, komunën ose identitetin"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          {isSearching && hasNextPage && isLoadingAll ? (
            <p className="text-xs text-muted-foreground">
              Po ngarkojmë regjistrimet e mbetura për të kërkuar në të gjithë
              arkivin…
            </p>
          ) : null}
        </div>
      </header>

      <VictimList
        victims={filteredVictims}
        totalRecords={totalRecords}
        hasMore={canAutoLoadMore}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={canAutoLoadMore ? () => fetchNextPage() : undefined}
      />
    </div>
  );
}
