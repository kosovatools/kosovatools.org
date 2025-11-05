"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

import { formatLabel } from "../lib/format";
import type { MemorialVictim } from "../types";

const FALLBACK_NAME = "Emër i panjohur";

export type VictimListProps = {
  victims: MemorialVictim[];
  totalRecords?: number | null;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onLoadAll?: () => void;
  isLoadingAll?: boolean;
  className?: string;
};

export function VictimList({
  victims,
  totalRecords,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onLoadAll,
  isLoadingAll = false,
  className,
}: VictimListProps) {
  const displayVictims = useMemo(() => victims, [victims]);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore) {
      return;
    }

    const node = loaderRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      {
        rootMargin: "256px 0px 128px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMore, displayVictims.length]);

  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>
          Po shfaqen {displayVictims.length.toLocaleString("sq-AL")} emra nga{" "}
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
          {hasMore && onLoadAll ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onLoadAll}
              disabled={isLoadingAll}
            >
              {isLoadingAll ? "Duke shkarkuar të gjitha…" : "Shfaq të gjithë"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {displayVictims.map((victim, index) => {
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
            <p
              key={key}
              className="border-border/40 text-center text-sm leading-relaxed text-foreground md:text-base"
            >
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
                  {new Date(victim.dateOfIncident).toLocaleDateString("sq-AL", {
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
          );
        })}
      </div>
      <div ref={loaderRef} className="h-px w-full" aria-hidden />
      {isLoadingMore ? (
        <p className="text-center text-xs text-muted-foreground">
          Duke ngarkuar më shumë emra…
        </p>
      ) : null}
    </section>
  );
}
