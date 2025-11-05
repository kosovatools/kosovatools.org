"use client";

import { useCallback, useMemo, useState } from "react";
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

const warRecordsDataset = createDatasetApi({
  prefix: "war",
  defaultInit: { cache: "no-store" },
});
const FIRST_CHUNK_FILE = "crimes-part-01.json";

type VictimChunk = {
  meta: {
    chunk: number;
    count: number;
    total: number;
    next: string | null;
  };
  records: MemorialVictim[];
};

async function fetchChunk(file?: string): Promise<VictimChunk> {
  const target = file ?? FIRST_CHUNK_FILE;

  const payload = await warRecordsDataset.fetchJson<VictimChunk>(target);
  if (!payload?.meta || !Array.isArray(payload.records)) {
    throw new Error(`Formati i papritur për ${target}`);
  }

  return payload;
}

export function WarRecordsClient() {
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const {
    data,
    error,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["war-records-victims"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchChunk(pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.meta.next ?? undefined,
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
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Emrat e dokumentuar
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Secili emër vjen nga Kosovo Memory Book, i kuruar nga Humanitarian Law
          Center. Shtresa e parë ngarkon 100 emrat e parë; lëvizni poshtë për të
          parë pjesën tjetër të listës.
        </p>
      </header>

      <VictimList
        victims={victims}
        totalRecords={totalRecords}
        hasMore={hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={hasNextPage ? () => fetchNextPage() : undefined}
        onLoadAll={hasNextPage ? handleLoadAll : undefined}
        isLoadingAll={isLoadingAll}
      />
    </div>
  );
}
