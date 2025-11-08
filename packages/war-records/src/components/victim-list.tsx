"use client";

import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import { cn } from "@workspace/ui/lib/utils";

import { formatLabel } from "../lib/format";
import type { MemorialVictim } from "../types";

const FALLBACK_NAME = "Emër i panjohur";
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  totalRecords,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  className,
}: VictimListProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const updateScrollMargin = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    const node = listRef.current;
    if (!node) {
      setScrollMargin(0);
      return;
    }
    const rect = node.getBoundingClientRect();
    setScrollMargin(rect.top + window.scrollY);
  }, []);

  useIsomorphicLayoutEffect(() => {
    updateScrollMargin();
  }, [updateScrollMargin]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.addEventListener("resize", updateScrollMargin);
    return () => {
      window.removeEventListener("resize", updateScrollMargin);
    };
  }, [updateScrollMargin]);

  const rowVirtualizer = useWindowVirtualizer({
    count: victims.length,
    estimateSize: () => 100,
    overscan: 10,
    scrollMargin,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoadingMore) {
      return;
    }

    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) {
      return;
    }

    if (lastItem.index >= victims.length - 5) {
      onLoadMore();
    }
  }, [virtualItems, hasMore, onLoadMore, isLoadingMore, victims.length]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const height = useMemo(
    () => rowVirtualizer.getTotalSize(),
    [rowVirtualizer, victims.length],
  );
  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>
          Po shfaqen {victims.length.toLocaleString("sq-AL")} emra nga{" "}
          {(totalRecords ?? victims.length).toLocaleString("sq-AL")}{" "}
          regjistrime.
        </span>
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <span>
            Burimi:{" "}
            <a
              href="https://www.kosovomemorybook.org/"
              className="text-primary underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Kosovo Memory Book
            </a>{" "}
            –{" "}
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
      </div>

      <div ref={listRef}>
        <div
          style={{
            height: `${height}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const victim = victims[virtualRow.index];
            if (!victim) {
              return null;
            }

            const index = virtualRow.index;
            const name =
              victim.fullName ||
              [victim.firstName, victim.lastName]
                .filter((part) => part && part.trim().length > 0)
                .join(" ") ||
              FALLBACK_NAME;

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
              victim.firstName,
              victim.lastName,
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
                  transform: `translateY(${virtualRow.start - scrollMargin}px)`,
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
                      {new Date(victim.dateOfIncident).toLocaleDateString(
                        "sq-AL",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
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
