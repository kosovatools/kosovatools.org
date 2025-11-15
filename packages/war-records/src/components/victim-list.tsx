"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import { cn } from "@workspace/ui/lib/utils";
import { formatDate } from "@workspace/utils";

import { formatLabel } from "../lib/format";
import type { MemorialVictim } from "../types";

const FALLBACK_NAME = "Emër i panjohur";

export type VictimListProps = {
  victims: MemorialVictim[];
  totalRecords?: number | null;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
};

export function VictimList({
  victims,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  className,
}: VictimListProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const canLoadMore = Boolean(hasMore && onLoadMore);
  const loadRequestedRef = useRef(false);
  const wasLoadingMoreRef = useRef(isLoadingMore);

  const rowVirtualizer = useWindowVirtualizer({
    count: canLoadMore ? victims.length + 1 : victims.length,
    estimateSize: () => 100,
    overscan: 10,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!canLoadMore) {
      loadRequestedRef.current = false;
      wasLoadingMoreRef.current = isLoadingMore;
      return;
    }

    if (wasLoadingMoreRef.current && !isLoadingMore) {
      loadRequestedRef.current = false;
    }
    wasLoadingMoreRef.current = isLoadingMore;
  }, [canLoadMore, isLoadingMore]);

  useEffect(() => {
    if (!canLoadMore || isLoadingMore || loadRequestedRef.current) {
      return;
    }

    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) {
      return;
    }

    if (lastItem.index >= victims.length) {
      loadRequestedRef.current = true;
      onLoadMore?.();
    }
  }, [canLoadMore, isLoadingMore, onLoadMore, virtualItems, victims.length]);

  const height = rowVirtualizer.getTotalSize();

  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <div ref={listRef}>
        <div
          style={{
            height: `${height}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const isLoaderRow =
              canLoadMore && virtualRow.index >= victims.length;
            if (isLoaderRow) {
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                    paddingBottom: "0.5rem",
                  }}
                >
                  <p className="text-center text-xs text-muted-foreground md:text-sm">
                    {isLoadingMore
                      ? "Duke ngarkuar më shumë emra…"
                      : "Lëviz edhe pak për të ngarkuar më shumë emra"}
                  </p>
                </div>
              );
            }

            const victim = victims[virtualRow.index];
            if (!victim) {
              return null;
            }

            const index = virtualRow.index;
            const name = victim.fullName || FALLBACK_NAME;

            const locations = [
              victim.placeOfIncident,
              victim.placeOfBirth ? `lindi në ${victim.placeOfBirth}` : null,
            ].filter(Boolean);

            const isChild =
              typeof victim.ageAtIncident === "number" &&
              victim.ageAtIncident < 18;
            const ageNode =
              typeof victim.ageAtIncident === "number" ? (
                <span
                  className={cn(
                    "inline",
                    isChild ? "font-semibold text-foreground" : undefined,
                  )}
                >
                  {victim.ageAtIncident} vjeç
                </span>
              ) : null;

            const metaSegments: ReactNode[] = [];
            if (ageNode) metaSegments.push(ageNode);
            if (victim.violation) {
              metaSegments.push(formatLabel(victim.violation));
            }
            if (victim.civilianStatus) {
              metaSegments.push(formatLabel(victim.civilianStatus));
            }
            if (victim.ethnicity) {
              metaSegments.push(formatLabel(victim.ethnicity));
            }

            const key = [
              victim.fullName,
              victim.dateOfBirth,
              victim.dateOfIncident,
              index,
            ]
              .filter((value) => value !== null && value !== undefined)
              .join("|");

            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                  paddingBottom: "0.5rem",
                }}
              >
                <p className="border-border/40 text-center text-sm leading-relaxed text-foreground md:text-base">
                  <span className="block font-semibold uppercase tracking-wide text-primary text-base md:text-xl">
                    {name.toLocaleUpperCase("sq-AL")}
                  </span>
                  <span className="mt-1 block text-xs uppercase tracking-wide text-muted-foreground md:text-sm">
                    {metaSegments.length > 0
                      ? metaSegments.map((segment, segmentIndex) => (
                          <span key={`${key}-meta-${segmentIndex}`}>
                            {segmentIndex > 0 ? " • " : null}
                            {segment}
                          </span>
                        ))
                      : "Detaje të paplota"}
                  </span>
                  {victim.dateOfIncident ? (
                    <span className="mt-1 block text-xs text-muted-foreground md:text-sm">
                      {formatDate(victim.dateOfIncident, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : null}
                  {locations.length > 0 ? (
                    <span className="mt-1 block text-xs text-muted-foreground md:text-sm">
                      {locations.join(" • ")}
                    </span>
                  ) : null}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      {isLoadingMore ? (
        <p className="text-center text-xs text-muted-foreground">
          Duke ngarkuar më shumë emra…
        </p>
      ) : null}
    </section>
  );
}
