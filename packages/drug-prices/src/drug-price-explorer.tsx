"use client";

import * as React from "react";
import { Filter, History, RefreshCcw, Search } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  formatCount,
  formatCurrency,
  formatDate,
  getSearchParamNumber,
  getSearchParamString,
  mergeSearchParams,
  type DateInput,
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

import type { DrugPriceRecord, DrugPriceRecordsDataset } from "./types";
import { loadDrugPriceRecords } from "./api";
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

const dateTimeFormatter = (value: DateInput) =>
  formatDate(value, {
    dateStyle: "medium",
    timeStyle: "short",
  });
function getCurrentSearchString(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const search = window.location.search;
  return search.startsWith("?") ? search.slice(1) : search;
}

type EnrichedRecord = DrugPriceRecord & {
  id: string;
  searchText: string;
};

type DrugPriceExplorerProps = {
  initialRecordsDataset?: DrugPriceRecordsDataset;
};

export function DrugPriceExplorer(props: DrugPriceExplorerProps = {}) {
  return (
    <React.Suspense fallback={<ExplorerLoadingFallback />}>
      <ExplorerErrorBoundary>
        <DrugPriceExplorerContent {...props} />
      </ExplorerErrorBoundary>
    </React.Suspense>
  );
}

function ExplorerLoadingFallback() {
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

class ExplorerErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
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
              {this.state.error.message || "Ndodhi një gabim i papritur."}
            </p>
            <Button variant="outline" onClick={this.handleRetry}>
              Provo përsëri
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

function DrugPriceExplorerContent({
  initialRecordsDataset,
}: DrugPriceExplorerProps = {}) {
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

  const { data: recordsDataset } = useSuspenseQuery<
    DrugPriceRecordsDataset,
    Error
  >({
    queryKey: ["drug-price-records"],
    queryFn: loadDrugPriceRecords,
    initialData: initialRecordsDataset,
  });

  const records = React.useMemo<EnrichedRecord[]>(
    () =>
      recordsDataset.records.map((record, index) => ({
        ...record,
        id: createRecordId(record, index),
        searchText: buildSearchText(record),
      })),
    [recordsDataset],
  );

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

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  React.useEffect(() => {
    const maxPageIndex = Math.max(totalPages - 1, 0);
    if (pageIndex > maxPageIndex) {
      setPageIndex(maxPageIndex);
      updateUrlState({
        page: pageIndexToParam(maxPageIndex),
      });
    }
  }, [pageIndex, totalPages, updateUrlState]);

  const startIndex = filteredRecords.length ? pageIndex * pageSize + 1 : 0;
  const endIndex = Math.min(filteredRecords.length, (pageIndex + 1) * pageSize);

  const paginatedRecords = filteredRecords.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize,
  );

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

  const datasetGeneratedAt = dateTimeFormatter(recordsDataset.generated_at);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Tabela e çmimeve</h3>
        <p className="text-sm text-muted-foreground">
          Çmimet shfaqen në euro dhe përditësohen sipas versionit më të fundit
          të publikuar.
        </p>
        <p className="text-xs text-muted-foreground">
          Dataseti u gjenerua më {datasetGeneratedAt}. Çdo rresht shfaq çmimet
          më të fundit për produktin përkatës dhe historikun e versioneve.
        </p>
      </div>
      <section className="space-y-6">
        <FieldGroup className="gap-6 border-y border-border/70 py-4">
          {appliedFilters > 0 ? (
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <Filter className="size-3.5" aria-hidden="true" />
                {appliedFilters} filtra aktiv
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <RefreshCcw className="size-4" aria-hidden="true" />
                Pastro filtrat
              </Button>
            </div>
          ) : null}
          <Field
            orientation="vertical"
            className="gap-2 md:flex-row md:items-center"
          >
            <FieldLabel className="text-sm font-medium">
              Kërko produktin
            </FieldLabel>
            <FieldContent className="flex-row flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={handleSearchInputChange}
                  placeholder="Emri, substanca ose mbajtësi i autorizimit"
                  className="pl-9"
                />
              </div>
              <NativeSelect
                value={searchField ?? ""}
                onChange={handleSearchFieldChange}
                className="w-full sm:w-[200px]"
              >
                <NativeSelectOption value="">
                  Të gjitha fushat
                </NativeSelectOption>
                {SEARCH_FIELD_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldContent>
          </Field>
          <Field
            orientation="vertical"
            className="gap-2 md:flex-row md:items-center"
          >
            <FieldLabel className="text-sm font-medium">
              Forma farmaceutike
            </FieldLabel>
            <FieldContent className="flex-1 min-w-[220px]">
              <FilterableCombobox
                value={formFilter}
                onValueChange={handleFormFilterChange}
                options={formOptions}
                placeholder="Të gjitha format"
                searchPlaceholder="Kërko formatin..."
                emptyMessage="Nuk ka përputhje"
                triggerClassName="h-10"
                disabled={!formOptions.length}
              />
            </FieldContent>
          </Field>
        </FieldGroup>
        <div ref={resultsRef} className="space-y-3">
          {paginatedRecords.length ? (
            <>
              <div className="hidden overflow-hidden rounded-lg border sm:block">
                <table className="min-w-full table-fixed divide-y divide-border text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="w-[46%] px-4 py-3 text-left font-medium">
                        Produkt
                      </th>
                      <th className="w-[27%] px-4 py-3 text-left font-medium">
                        Çmimet
                      </th>
                      <th className="w-[27%] px-4 py-3 text-left font-medium">
                        Versioni &amp; vlefshmëria
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {paginatedRecords.map((record) => {
                      const sections = getReferenceSections(record);
                      return (
                        <React.Fragment key={record.id}>
                          <tr className="align-top">
                            <td className="w-[46%] px-4 py-3">
                              <p className="font-semibold text-base">
                                {record.product_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {record.active_substance ?? "—"}
                              </p>
                              <dl className="mt-2 grid gap-3 text-xs sm:grid-cols-2">
                                <div className="space-y-0.5">
                                  <dt className="font-semibold text-foreground">
                                    ATC
                                  </dt>
                                  <dd className="break-words text-muted-foreground">
                                    {record.atc_code ?? "—"}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="font-semibold text-foreground">
                                    Doza
                                  </dt>
                                  <dd className="break-words text-muted-foreground">
                                    {record.dose ?? "—"}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="font-semibold text-foreground">
                                    Forma
                                  </dt>
                                  <dd className="break-words text-muted-foreground">
                                    {record.pharmaceutical_form ?? "—"}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="font-semibold text-foreground">
                                    Paketimi
                                  </dt>
                                  <dd className="break-words text-muted-foreground">
                                    {record.packaging ?? "—"}
                                  </dd>
                                </div>
                                <div className="space-y-0.5 sm:col-span-2">
                                  <dt className="font-semibold text-foreground">
                                    Autoriteti
                                  </dt>
                                  <dd className="break-words text-muted-foreground">
                                    {record.marketing_authorisation_holder ??
                                      "—"}
                                  </dd>
                                </div>
                              </dl>
                            </td>
                            <td className="w-[27%] px-4 py-3">
                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Shumicë
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(record.price_wholesale)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Me marzhë
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(record.price_with_margin)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Pakicë
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(record.price_retail)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="w-[27%] px-4 py-3 space-y-2">
                              <p className="font-semibold">
                                Versioni {record.latest_version}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {record.manufacturer ?? "Prodhues pa të dhëna"}
                              </p>
                              <div className="text-sm">
                                <p className="font-medium">
                                  {formatDate(record.valid_until)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {record.authorization_number ??
                                    "Pa numër autorizimi"}
                                </p>
                              </div>
                            </td>
                          </tr>
                          {hasExpandableDetails(record) ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-4">
                                <details className="group rounded-lg border bg-muted/30 px-4 py-3">
                                  <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                                    <History className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
                                    Historiku i çmimeve dhe referencat
                                  </summary>
                                  <div className="mt-4 space-y-4">
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

              <div className="space-y-3 sm:hidden">
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
                      className="space-y-3 rounded-lg border bg-card p-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <p className="text-base font-semibold">
                          {record.product_name}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {record.active_substance ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground break-words">
                            {record.marketing_authorisation_holder ?? "—"}
                          </p>
                        </div>
                      </div>
                      <dl className="grid gap 2 text-sm">
                        <div className="flex flex-wrap gap-4">
                          <div className="min-w-[45%] flex-1 space-y-0.5">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              ATC
                            </dt>
                            <dd className="font-medium break-words">
                              {record.atc_code ?? "—"}
                            </dd>
                          </div>
                          <div className="min-w-[45%] flex-1 space-y-0.5">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Doza
                            </dt>
                            <dd className="font-medium break-words">
                              {record.dose ?? "—"}
                            </dd>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="min-w-[45%] flex-1 space-y-0.5">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Forma
                            </dt>
                            <dd className="font-medium break-words">
                              {record.pharmaceutical_form ?? "—"}
                            </dd>
                          </div>
                          <div className="min-w-[45%] flex-1 space-y-0.5">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Paketimi
                            </dt>
                            <dd className="font-medium break-words">
                              {record.packaging ?? "—"}
                            </dd>
                          </div>
                        </div>
                      </dl>
                      <div className="divide-y divide-border rounded-xl border bg-muted/30 text-sm">
                        {mobileStats.map((stat) => (
                          <div
                            key={`${record.id}-${stat.key}`}
                            className={cn(
                              "flex items-center justify-between gap-4 px-3 py-2",
                              stat.highlight && "bg-primary/5",
                            )}
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {stat.label}
                            </span>
                            <span
                              className={cn(
                                "text-base font-semibold text-foreground",
                                stat.highlight && "text-primary",
                              )}
                            >
                              {stat.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      {hasExpandableDetails(record) ? (
                        <details className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                          <summary className="flex cursor-pointer items-center gap-2 font-medium">
                            <History className="size-4" aria-hidden="true" />
                            Historiku & referencat
                          </summary>
                          <div className="mt-3 space-y-3 text-xs">
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
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground">
                  Duke shfaqur {startIndex || 0}-{endIndex} nga{" "}
                  {formatCount(filteredRecords.length)} produkte.
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={pageIndex === 0}
                  >
                    Më parë
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={pageIndex >= totalPages - 1}
                  >
                    Tjetra
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nuk ka produkte për këto filtra</CardTitle>
                <CardDescription>
                  Provo të heqësh disa filtra ose përdor një term tjetër
                  kërkimi.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
