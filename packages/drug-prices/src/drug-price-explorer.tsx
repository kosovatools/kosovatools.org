"use client";

import * as React from "react";
import { Filter, History, RefreshCcw, Search, CheckCircle2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  formatCount,
  formatCurrency,
  formatDate,
  getSearchParamNumber,
  getSearchParamString,
  mergeSearchParams,
} from "@workspace/utils";
import type { SearchParamUpdates } from "@workspace/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { FilterableCombobox } from "@workspace/ui/custom-components/filterable-combobox";
import { cn } from "@workspace/ui/lib/utils";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";

import { loadDrugPriceRecords, checkDrugPriceVersions } from "./api";
import {
  PAGE_SIZE,
  SEARCH_FIELD_OPTIONS,
  SEARCH_FIELD_ACCESSORS,
  SearchField,
  isValidSearchField,
  pageIndexToParam,
} from "./constants";
import {
  buildSearchText,
  createRecordId,
  getReferenceSections,
  hasExpandableDetails,
} from "./utils/records";
import { VersionHistoryTable } from "./components/version-history-table";
import { ReferencePriceSection } from "./components/reference-price-section";

function getCurrentSearchString(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const search = window.location.search;
  return search.startsWith("?") ? search.slice(1) : search;
}

export function DrugPriceExplorer() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const [searchParamsSnapshot, setSearchParamsSnapshot] = React.useState(() =>
    getCurrentSearchString(),
  );
  const searchParamsRef = React.useRef(searchParamsSnapshot);

  React.useEffect(() => {
    searchParamsRef.current = searchParamsSnapshot;
  }, [searchParamsSnapshot]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const syncFromLocation = () => {
      const nextSearch = getCurrentSearchString();
      if (nextSearch !== searchParamsRef.current) {
        searchParamsRef.current = nextSearch;
        setSearchParamsSnapshot(nextSearch);
      }
    };
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => {
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, []);

  const urlState = React.useMemo(() => {
    const params = new URLSearchParams(searchParamsSnapshot);
    const searchValue = getSearchParamString(params, "search") ?? "";
    const versionValue = getSearchParamString(params, "version") ?? null;
    const formValue = getSearchParamString(params, "form") ?? null;
    const rawSearchField = getSearchParamString(params, "searchField");
    const normalizedSearchField =
      rawSearchField && isValidSearchField(rawSearchField)
        ? rawSearchField
        : null;
    const rawPageIndex = getSearchParamNumber(params, "page", {
      integer: true,
      min: 0,
    });
    const normalizedPageIndex =
      typeof rawPageIndex === "number" && rawPageIndex >= 0 ? rawPageIndex : 0;

    return {
      search: searchValue,
      version: versionValue,
      form: formValue,
      searchField: normalizedSearchField,
      pageIndex: normalizedPageIndex,
      needsPageIndexNormalization:
        rawPageIndex != null && rawPageIndex !== normalizedPageIndex,
      needsSearchFieldNormalization:
        rawSearchField != null && rawSearchField !== normalizedSearchField,
    };
  }, [searchParamsSnapshot]);

  const [search, setSearch] = React.useState(urlState.search);
  const [versionFilter, setVersionFilter] = React.useState<string | null>(
    urlState.version,
  );
  const [formFilter, setFormFilter] = React.useState<string | null>(
    urlState.form,
  );
  const [searchField, setSearchField] = React.useState<SearchField | null>(
    urlState.searchField,
  );
  const [pageIndex, setPageIndex] = React.useState(urlState.pageIndex);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSearch(urlState.search);
  }, [urlState.search]);

  React.useEffect(() => {
    setVersionFilter(urlState.version);
  }, [urlState.version]);

  React.useEffect(() => {
    setFormFilter(urlState.form);
  }, [urlState.form]);

  React.useEffect(() => {
    setSearchField(urlState.searchField);
  }, [urlState.searchField]);

  React.useEffect(() => {
    setPageIndex(urlState.pageIndex);
  }, [urlState.pageIndex]);

  const updateUrlState = React.useCallback((updates: SearchParamUpdates) => {
    const nextParams = mergeSearchParams(searchParamsRef.current, updates);
    const queryString = nextParams.toString();
    searchParamsRef.current = queryString;
    setSearchParamsSnapshot(queryString);
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  React.useEffect(() => {
    if (urlState.needsPageIndexNormalization) {
      updateUrlState({
        page: pageIndexToParam(urlState.pageIndex),
      });
    }
  }, [
    updateUrlState,
    urlState.needsPageIndexNormalization,
    urlState.pageIndex,
  ]);

  React.useEffect(() => {
    if (urlState.needsSearchFieldNormalization) {
      updateUrlState({
        searchField: urlState.searchField,
      });
    }
  }, [
    updateUrlState,
    urlState.needsSearchFieldNormalization,
    urlState.searchField,
  ]);

  const applyFilterUpdates = React.useCallback(
    (updates: SearchParamUpdates, resetPage = false) => {
      if (resetPage && pageIndex !== 0) {
        setPageIndex(0);
      }
      const nextUpdates = resetPage ? { ...updates, page: null } : updates;
      updateUrlState(nextUpdates);
    },
    [pageIndex, updateUrlState],
  );

  const scrollToResultsTop = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const {
    data: recordsDataset,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["drug-price-records"],
    queryFn: loadDrugPriceRecords,
    staleTime: Infinity,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // Check for new versions (bypassing cache)
      await checkDrugPriceVersions();

      // Invalidate and refetch records
      await queryClient.invalidateQueries({ queryKey: ["drug-price-records"] });
      await refetch();
    } catch (err) {
      console.error("Failed to refresh data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const records = React.useMemo(() => {
    if (!recordsDataset) {
      return [];
    }
    return recordsDataset.records.map((record, index) => ({
      ...record,
      id: createRecordId(record, index),
      searchText: buildSearchText(record),
    }));
  }, [recordsDataset]);

  const formOptions = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of records) {
      const form = record.pharmaceutical_form?.trim();
      if (!form) continue;
      counts.set(form, (counts.get(form) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1];
        }
        return a[0].localeCompare(b[0], "sq");
      })
      .map(([form, count]) => ({
        value: form,
        label: form,
        notes: `${formatCount(count)} produkte`,
      }));
  }, [records]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredRecords = React.useMemo(() => {
    return records.filter((record) => {
      if (normalizedSearch) {
        if (searchField) {
          const accessor = SEARCH_FIELD_ACCESSORS[searchField];
          const candidate = accessor(record);
          const normalizedCandidate =
            candidate == null ? "" : candidate.toString().toLowerCase();
          if (!normalizedCandidate.includes(normalizedSearch)) {
            return false;
          }
        } else if (!record.searchText.includes(normalizedSearch)) {
          return false;
        }
      }
      if (versionFilter && record.latest_version !== versionFilter) {
        return false;
      }
      if (formFilter && record.pharmaceutical_form !== formFilter) {
        return false;
      }
      return true;
    });
  }, [records, normalizedSearch, searchField, versionFilter, formFilter]);

  const pageSize = PAGE_SIZE;

  const totalPages = recordsDataset
    ? Math.max(1, Math.ceil(filteredRecords.length / pageSize))
    : 0;

  React.useEffect(() => {
    const maxPageIndex = Math.max(totalPages - 1, 0);
    if (pageIndex > maxPageIndex) {
      setPageIndex(maxPageIndex);
      updateUrlState({
        page: pageIndexToParam(maxPageIndex),
      });
    }
  }, [pageIndex, totalPages, updateUrlState]);

  const appliedFilters =
    (normalizedSearch ? 1 : 0) +
    (versionFilter ? 1 : 0) +
    (formFilter ? 1 : 0) +
    (normalizedSearch && searchField ? 1 : 0);

  const clearFilters = React.useCallback(() => {
    setSearch("");
    setVersionFilter(null);
    setFormFilter(null);
    setSearchField(null);
    applyFilterUpdates(
      {
        search: null,
        version: null,
        form: null,
        searchField: null,
      },
      true,
    );
  }, [applyFilterUpdates]);

  const handleFormFilterChange = (value: string | null) => {
    const nextValue = value || null;
    setFormFilter(nextValue);
    applyFilterUpdates({ form: nextValue }, true);
  };

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setSearch(value);
    applyFilterUpdates({ search: value || null }, true);
  };

  const handleSearchFieldChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;
    const nextField = value && isValidSearchField(value) ? value : null;
    setSearchField(nextField);
    applyFilterUpdates({ searchField: nextField }, true);
  };

  const handlePreviousPage = () => {
    if (pageIndex === 0) return;
    const nextIndex = Math.max(pageIndex - 1, 0);
    setPageIndex(nextIndex);
    updateUrlState({
      page: pageIndexToParam(nextIndex),
    });
    scrollToResultsTop();
  };

  const handleNextPage = () => {
    const maxPageIndex = Math.max(totalPages - 1, 0);
    if (pageIndex >= maxPageIndex) return;
    const nextIndex = Math.min(pageIndex + 1, maxPageIndex);
    setPageIndex(nextIndex);
    updateUrlState({
      page: pageIndexToParam(nextIndex),
    });
    scrollToResultsTop();
  };

  if (isError) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle>Nuk u ngarkuan të dhënat</CardTitle>
          <CardDescription>
            Provo të rifreskosh faqen ose kontrollo lidhjen me internetin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-destructive">
            {error?.message || "Ndodhi një gabim i papritur."}
          </p>
          <Button onClick={() => window.location.reload()}>Rifresko faqen</Button>
        </CardContent>
      </Card>
    );
  }

  if (!recordsDataset) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Po ngarkojmë të dhënat</CardTitle>
          <CardDescription>
            Lista e barnave dhe versionet përkatëse po përgatiten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Kjo mund të zgjasë disa sekonda, sidomos herën e parë.
          </p>
        </CardContent>
      </Card>
    );
  }

  const startIndex = pageIndex * pageSize + 1;
  const endIndex = Math.min(filteredRecords.length, (pageIndex + 1) * pageSize);

  const paginatedRecords = filteredRecords.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize,
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Lista e produkteve
          </h2>
          <p className="text-sm text-muted-foreground">
            Përditësimi i fundit: {formatDate(recordsDataset.generated_at)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCcw
            className={cn("size-4", isRefreshing && "animate-spin")}
            aria-hidden="true"
          />1
          {isRefreshing ? "Duke përditësuar..." : "Kontrollo për përditësime"}
        </Button>
      </div>

      <FieldGroup className="gap-4">
        {appliedFilters > 0 ? (
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground border-b border-border/50 pb-3 mb-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
              <Filter className="size-3.5" aria-hidden="true" />
              {appliedFilters} filtra aktiv
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2 h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <RefreshCcw className="size-3.5" aria-hidden="true" />
              Pastro filtrat
            </Button>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field orientation="vertical" className="gap-1.5">
            <FieldLabel className="text-sm font-medium">
              Kërko produktin
            </FieldLabel>
            <FieldContent className="flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={handleSearchInputChange}
                  placeholder="Emri, substanca..."
                  className="pl-9"
                />
              </div>
            </FieldContent>
          </Field>

          <Field orientation="vertical" className="gap-1.5">
            <FieldLabel className="text-sm font-medium">
              Fusha e kërkimit
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                value={searchField ?? ""}
                onChange={handleSearchFieldChange}
                className="w-full"
              >
                <NativeSelectOption value="">Të gjitha fushat</NativeSelectOption>
                {SEARCH_FIELD_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldContent>
          </Field>

          <Field orientation="vertical" className="gap-1.5">
            <FieldLabel className="text-sm font-medium">
              Forma farmaceutike
            </FieldLabel>
            <FieldContent>
              <FilterableCombobox
                value={formFilter}
                onChange={handleFormFilterChange}
                options={formOptions}
                placeholder="Të gjitha format"
                searchPlaceholder="Kërko formatin..."
                emptyMessage="Nuk ka përputhje"
                triggerClassName="w-full"
                disabled={!formOptions.length}
              />
            </FieldContent>
          </Field>
        </div>
      </FieldGroup>

      <div ref={resultsRef} className="space-y-4">
        {paginatedRecords.length ? (
          <>
            <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm sm:block">
              <table className="min-w-full table-fixed divide-y divide-border text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[45%] px-4 py-3 text-left font-medium">
                      Produkt
                    </th>
                    <th className="w-[25%] px-4 py-3 text-left font-medium">
                      Çmimet
                    </th>
                    <th className="w-[30%] px-4 py-3 text-left font-medium">
                      Versioni &amp; vlefshmëria
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {paginatedRecords.map((record) => {
                    const sections = getReferenceSections(record);
                    return (
                      <React.Fragment key={record.id}>
                        <tr className="group transition-colors hover:bg-muted/30">
                          <td className="w-[45%] px-4 py-3 align-top">
                            <div className="space-y-1">
                              <p className="font-semibold text-base text-foreground">
                                {record.product_name}
                              </p>
                              <p className="text-sm font-medium text-primary">
                                {record.active_substance ?? "—"}
                              </p>
                            </div>
                            <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                              <div>
                                <dt className="font-medium text-muted-foreground">ATC</dt>
                                <dd className="text-foreground">{record.atc_code ?? "—"}</dd>
                              </div>
                              <div>
                                <dt className="font-medium text-muted-foreground">Doza</dt>
                                <dd className="text-foreground">{record.dose ?? "—"}</dd>
                              </div>
                              <div>
                                <dt className="font-medium text-muted-foreground">Forma</dt>
                                <dd className="text-foreground">{record.pharmaceutical_form ?? "—"}</dd>
                              </div>
                              <div>
                                <dt className="font-medium text-muted-foreground">Paketimi</dt>
                                <dd className="text-foreground">{record.packaging ?? "—"}</dd>
                              </div>
                              <div className="sm:col-span-2 pt-0.5">
                                <dt className="font-medium text-muted-foreground">Autoriteti</dt>
                                <dd className="text-foreground">{record.marketing_authorisation_holder ?? "—"}</dd>
                              </div>
                            </dl>
                          </td>
                          <td className="w-[25%] px-4 py-3 align-top">
                            <div className="space-y-2 rounded-lg bg-muted/30 p-2.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Shumicë</span>
                                <span className="font-medium tabular-nums">
                                  {formatCurrency(record.price_wholesale)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Me marzhë</span>
                                <span className="font-medium tabular-nums">
                                  {formatCurrency(record.price_with_margin)}
                                </span>
                              </div>
                              <div className="border-t border-border/50 pt-1.5 flex items-center justify-between text-sm">
                                <span className="font-medium text-foreground">Pakicë</span>
                                <span className="font-bold text-primary tabular-nums text-base">
                                  {formatCurrency(record.price_retail)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="w-[30%] px-4 py-3 align-top space-y-2">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                                Versioni {record.latest_version}
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {record.manufacturer ?? "Prodhues pa të dhëna"}
                              </p>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="size-4 text-green-500 mt-0.5" />
                              <div>
                                <p className="font-medium text-foreground">
                                  Vlen deri: {formatDate(record.valid_until)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Nr: {record.authorization_number ?? "Pa numër"}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {hasExpandableDetails(record) ? (
                          <tr>
                            <td colSpan={3} className="p-4 bg-muted/40">
                              <details className="group/details">
                                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors select-none">
                                  <History className="size-4 transition-transform group-open/details:rotate-90" />
                                  Historiku i çmimeve dhe referencat
                                </summary>
                                <div className="mt-3 space-y-4">
                                  <VersionHistoryTable
                                    entries={record.version_history}
                                  />
                                  {sections.map((section) => (
                                    <ReferencePriceSection
                                      key={`${record.id}-${section.title}`}
                                      section={section}
                                    />
                                  ))}
                                </div>
                              </details>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 sm:hidden">
              {paginatedRecords.map((record) => {
                const sections = getReferenceSections(record);
                const mobileStats = [
                  {
                    key: "wholesale",
                    label: "Shumicë",
                    value: formatCurrency(record.price_wholesale),
                    highlight: false,
                  },
                  {
                    key: "margin",
                    label: "Me marzhë",
                    value: formatCurrency(record.price_with_margin),
                    highlight: false,
                  },
                  {
                    key: "retail",
                    label: "Pakicë",
                    value: formatCurrency(record.price_retail),
                    highlight: false,
                  },
                  {
                    key: "valid",
                    label: "Vlen deri",
                    value: formatDate(record.valid_until),
                    highlight: true,
                  },
                ] as const;
                return (
                  <div
                    key={`${record.id}-card`}
                    className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-lg font-semibold text-foreground leading-tight">
                          {record.product_name}
                        </p>
                        <span className="shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                          {record.latest_version}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-primary">
                          {record.active_substance ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground break-words">
                          {record.marketing_authorisation_holder ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm rounded-lg bg-muted/30 p-3">
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium text-muted-foreground uppercase">ATC</dt>
                        <dd className="font-medium">{record.atc_code ?? "—"}</dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium text-muted-foreground uppercase">Doza</dt>
                        <dd className="font-medium">{record.dose ?? "—"}</dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium text-muted-foreground uppercase">Forma</dt>
                        <dd className="font-medium">{record.pharmaceutical_form ?? "—"}</dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium text-muted-foreground uppercase">Paketimi</dt>
                        <dd className="font-medium">{record.packaging ?? "—"}</dd>
                      </div>
                    </div>

                    <div className="divide-y divide-border rounded-xl border bg-card text-sm">
                      {mobileStats.map((stat) => (
                        <div
                          key={`${record.id}-${stat.key}`}
                          className={cn(
                            "flex items-center justify-between gap-4 px-4 py-2.5",
                            stat.highlight && "bg-primary/5 rounded-b-xl",
                          )}
                        >
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {stat.label}
                          </span>
                          <span
                            className={cn(
                              "text-base font-semibold text-foreground tabular-nums",
                              stat.highlight && "text-primary",
                            )}
                          >
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {hasExpandableDetails(record) ? (
                      <details className="group/mobile rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                        <summary className="flex cursor-pointer items-center gap-2 font-medium text-primary">
                          <History className="size-4 transition-transform group-open/mobile:rotate-90" />
                          Historiku & referencat
                        </summary>
                        <div className="mt-3 space-y-3 text-xs pl-2 border-l-2 border-primary/20">
                          <VersionHistoryTable
                            entries={record.version_history}
                          />
                          {sections.map((section) => (
                            <ReferencePriceSection
                              key={`${record.id}-${section.title}-mobile`}
                              section={section}
                            />
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between border-t border-border/50">
              <span className="text-sm text-muted-foreground text-center sm:text-left">
                Duke shfaqur <span className="font-medium text-foreground">{startIndex || 0}-{endIndex}</span> nga{" "}
                <span className="font-medium text-foreground">{formatCount(filteredRecords.length)}</span> produkte.
              </span>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={pageIndex === 0}
                  className="w-24"
                >
                  Më parë
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={pageIndex >= totalPages - 1}
                  className="w-24"
                >
                  Tjetra
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Card className="border-dashed">
            <CardHeader className="text-center py-12">
              <div className="mx-auto bg-muted/50 rounded-full p-3 w-fit mb-4">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <CardTitle>Nuk u gjetën produkte</CardTitle>
              <CardDescription>
                Provo të ndryshosh kriteret e kërkimit ose pastro filtrat.
              </CardDescription>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mx-auto mt-4"
              >
                Pastro të gjitha filtrat
              </Button>
            </CardHeader>
          </Card>
        )}
      </div>
    </section>
  );
}
