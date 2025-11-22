"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MiniSearch from "minisearch";
import { ChevronDown, Link, Search, X } from "lucide-react";

import { loadAtkFaq, type AtkFaqEntry } from "@workspace/dataset-api";
import { mergeSearchParams } from "@workspace/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Field, FieldContent } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

type SearchableEntry = {
  entry: AtkFaqEntry;
  anchorId: string;
  plainAnswer: string;
};

type IndexedFaqDocument = {
  anchorId: string;
  question: string;
  answer: string;
};

function getHashId(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchable(entries: AtkFaqEntry[]): SearchableEntry[] {
  return entries.map((entry, index) => {
    const plainAnswer = entry.answer_text ?? stripHtml(entry.answer_html);
    const anchorId =
      entry.id && entry.id.trim().length > 0
        ? entry.id
        : `atk-faq-${index + 1}`;

    return { entry, anchorId, plainAnswer };
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightText(text: string, terms: string[]): string {
  if (terms.length === 0) return escapeHtml(text);

  const escapedTerms = terms
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escapedTerms.length === 0) return escapeHtml(text);

  const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
  return escapeHtml(text).replace(regex, "<mark>$1</mark>");
}

function createSearchIndex(
  entries: SearchableEntry[],
): MiniSearch<IndexedFaqDocument> {
  const docs: IndexedFaqDocument[] = entries.map((entry) => ({
    anchorId: entry.anchorId,
    question: entry.entry.question,
    answer: entry.plainAnswer,
  }));

  const searchIndex = new MiniSearch<IndexedFaqDocument>({
    idField: "anchorId",
    fields: ["question", "answer"],
    storeFields: ["anchorId"],
    searchOptions: {
      prefix: true,
      fuzzy: 0.15,
      boost: { question: 2 },
    },
  });

  searchIndex.addAll(docs);
  return searchIndex;
}

function FaqItem({
  searchable,
  highlightedQuestion,
  shareHref,
  forceOpen = false,
  defaultOpen = false,
}: {
  searchable: SearchableEntry;
  highlightedQuestion?: string | null;
  shareHref: string;
  forceOpen?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

  return (
    <Collapsible
      id={searchable.anchorId}
      open={open}
      onOpenChange={setOpen}
      style={{ scrollMarginTop: "96px" }}
    >
      <div className="relative rounded-xl border bg-card/60 shadow-sm">
        <a
          href={shareHref}
          className="text-muted-foreground hover:text-primary absolute right-3 top-3 inline-flex rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Kopjo lidhjen e kësaj pyetjeje"
        >
          <Link className="h-4 w-4" aria-hidden />
        </a>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start justify-between gap-3 px-4 py-4 pr-11 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <div className="flex flex-col gap-1 pr-6">
              <span className="flex items-start gap-2 text-base font-semibold leading-snug">
                <span>
                  {highlightedQuestion ? (
                    <span
                      dangerouslySetInnerHTML={{ __html: highlightedQuestion }}
                    />
                  ) : (
                    searchable.entry.question
                  )}
                </span>
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                open ? "-rotate-180" : "",
              )}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <div className="px-4 pb-4 pt-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p]:mt-0 [&_ul]:list-disc [&_mark]:bg-amber-200 [&_mark]:px-0.5 [&_mark]:py-0.5 [&_mark]:rounded">
            <p className="whitespace-pre-line break-words">
              {searchable.entry.answer_html}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function AtkFaqExplorer() {
  const [searchInput, setSearchInput] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("q")?.trim() ?? "";
  });
  const [targetId, setTargetId] = useState<string | null>(() => getHashId());
  const normalizedSearch = useMemo(
    () => searchInput.trim().toLocaleLowerCase("sq-AL"),
    [searchInput],
  );
  const deferredSearch = useDeferredValue(normalizedSearch);

  const { data, status, error } = useQuery({
    queryKey: ["atk", "faq"],
    queryFn: loadAtkFaq,
    staleTime: Infinity,
  });

  useEffect(() => {
    const params = mergeSearchParams(window.location.search, {
      q: normalizedSearch || null,
    });
    const next = params.toString();
    const newUrl = `${window.location.pathname}${next ? `?${next}` : ""}`;
    window.history.replaceState(null, "", newUrl);
    setTargetId(null);
  }, [normalizedSearch]);

  useEffect(() => {
    const handleHashChange = () => {
      setTargetId(getHashId());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [data, targetId]);

  if (status === "error") {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error instanceof Error
          ? error.message
          : "Ndodhi një gabim gjatë ngarkimit të pyetjeve."}
      </div>
    );
  }

  if (status === "pending" || !data) {
    return (
      <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  const searchableEntries = useMemo(() => buildSearchable(data), [data]);

  const anchorMap = useMemo(
    () => new Map(searchableEntries.map((entry) => [entry.anchorId, entry])),
    [searchableEntries],
  );

  const searchIndex = useMemo(
    () => createSearchIndex(searchableEntries),
    [searchableEntries],
  );

  const results = useMemo(() => {
    if (!deferredSearch) {
      return searchableEntries.map((entry) => ({
        entry,
        highlightedQuestion: null,
      }));
    }

    const hits = searchIndex.search(deferredSearch);
    const ranked = hits
      .map((hit) => {
        const anchorId =
          typeof hit.id === "string" ? hit.id : String(hit.id ?? "");
        const entry = anchorMap.get(anchorId);
        if (!entry) return null;
        const terms = Array.isArray(hit.terms) ? hit.terms : [];
        return {
          entry,
          highlightedQuestion:
            terms.length > 0
              ? highlightText(entry.entry.question, terms)
              : null,
        };
      })
      .filter(
        (
          value,
        ): value is {
          entry: SearchableEntry;
          highlightedQuestion: string | null;
        } => value !== null,
      );

    if (ranked.length > 0) {
      return ranked;
    }

    // Fallback simple contains for cases where MiniSearch trims the query too aggressively.
    return searchableEntries
      .filter((entry) => {
        const haystack = `${entry.entry.question} ${entry.plainAnswer}`
          .toLocaleLowerCase("sq-AL")
          .trim();
        return haystack.includes(deferredSearch);
      })
      .map((entry) => ({
        entry,
        highlightedQuestion: highlightText(entry.entry.question, [
          deferredSearch,
        ]),
      }));
  }, [anchorMap, deferredSearch, searchIndex, searchableEntries]);

  const resultCount = results.length;
  const totalEntries = searchableEntries.length;

  const buildShareHref = useMemo(() => {
    return (anchorId: string) => {
      if (typeof window === "undefined") {
        return `#${anchorId}`;
      }
      const params = mergeSearchParams(window.location.search, {
        q: normalizedSearch || null,
      });
      const qs = params.toString();
      return `${window.location.pathname}${qs ? `?${qs}` : ""}#${anchorId}`;
    };
  }, [normalizedSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Field className="flex-1">
          <FieldContent>
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Kërko sipas temës (p.sh. TVSH, deklarimi, PEF)…"
                className="pl-9 pr-10"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Pastro kërkimin"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </FieldContent>
        </Field>
        <div className="text-sm text-muted-foreground">
          {resultCount} nga {totalEntries} përgjigje
        </div>
      </div>

      <Separator />

      {resultCount === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Nuk u gjet asnjë pyetje që përputhet me kërkimin.
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(({ entry, highlightedQuestion }, index) => {
            const shareHref = buildShareHref(entry.anchorId);
            const forceOpen = targetId === entry.anchorId;
            return (
              <FaqItem
                key={entry.anchorId}
                searchable={entry}
                highlightedQuestion={highlightedQuestion}
                shareHref={shareHref}
                forceOpen={forceOpen}
                defaultOpen={!deferredSearch && index === 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
