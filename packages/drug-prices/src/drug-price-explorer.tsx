"use client";

import * as React from "react";
import {
  CalendarClock,
  History,
  Layers3,
  PackageCheck,
  Pill,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { createCurrencyFormatter, formatCount } from "@workspace/chart-utils";
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

import type {
  DrugPriceRecord,
  DrugPriceRecordsDataset,
  DrugPriceSnapshot,
  DrugPriceVersionsDataset,
  DrugReferenceCountry,
  DrugReferencePrices,
} from "./types";

const priceFormatter = createCurrencyFormatter("sq", "EUR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const shortDateFormatter = new Intl.DateTimeFormat("sq-AL", {
  dateStyle: "medium",
});
const longDateFormatter = new Intl.DateTimeFormat("sq-AL", {
  dateStyle: "long",
});
const dateTimeFormatter = new Intl.DateTimeFormat("sq-AL", {
  dateStyle: "medium",
  timeStyle: "short",
});
const versionCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const PAGE_SIZES = [25, 50, 100] as const;

const REFERENCE_PRICE_LABELS: Record<DrugReferenceCountry, string> = {
  macedonia: "Maqedonia e Veriut",
  montenegro: "Mali i Zi",
  croatia: "Kroacia",
  slovenia: "Sllovenia",
  bulgaria: "Bullgaria",
  estonia: "Estonia",
  other: "Tjetër",
};

type EnrichedRecord = DrugPriceRecord & {
  id: string;
  searchText: string;
};

type DrugPriceExplorerProps = {
  recordsDataset: DrugPriceRecordsDataset;
  versionsDataset: DrugPriceVersionsDataset;
};

type ReferenceSection = {
  title: string;
  entries: Array<{ label: string; value: number }>;
};

type SummaryStatProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
};

function formatDate(
  value: string | null | undefined,
  mode: "short" | "long" = "short",
): string {
  if (!value) return "—";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  const formatter = mode === "long" ? longDateFormatter : shortDateFormatter;
  return formatter.format(new Date(timestamp));
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return dateTimeFormatter.format(new Date(timestamp));
}

function createRecordId(record: DrugPriceRecord, index: number): string {
  const baseIdentifier =
    record.authorization_number ??
    (record.serial_number != null ? String(record.serial_number) : null) ??
    record.product_name ??
    "record";

  return `${baseIdentifier}-${index}`;
}

function buildSearchText(record: DrugPriceRecord): string {
  return [
    record.product_name,
    record.active_substance,
    record.atc_code,
    record.dose,
    record.pharmaceutical_form,
    record.packaging,
    record.marketing_authorisation_holder,
    record.manufacturer,
    record.authorization_number,
    record.latest_version,
  ]
    .map((value) => (value ?? "").toString().toLowerCase())
    .join(" ");
}

function referenceEntries(map?: DrugReferencePrices | null) {
  if (!map) return [] as Array<{ label: string; value: number }>;
  return (Object.keys(REFERENCE_PRICE_LABELS) as Array<DrugReferenceCountry>)
    .map((key) => {
      const value = map[key];
      if (value == null) return null;
      return { label: REFERENCE_PRICE_LABELS[key], value };
    })
    .filter((entry): entry is { label: string; value: number } =>
      Boolean(entry),
    );
}

function getReferenceSections(record: DrugPriceRecord): ReferenceSection[] {
  const sections: ReferenceSection[] = [];
  const primary = referenceEntries(record.reference_prices);
  if (primary.length) {
    sections.push({
      title: "Çmimet referente (primare)",
      entries: primary,
    });
  }
  const secondary = referenceEntries(record.reference_prices_secondary);
  if (secondary.length) {
    sections.push({
      title: "Çmimet referente (sekondare)",
      entries: secondary,
    });
  }
  return sections;
}

function hasExpandableDetails(record: DrugPriceRecord): boolean {
  return (
    (record.version_history?.length ?? 0) > 1 ||
    Boolean(record.reference_prices) ||
    Boolean(record.reference_prices_secondary)
  );
}

function SummaryStat({ icon, label, value, helper }: SummaryStatProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className="rounded-full bg-primary/10 p-2 text-primary"
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {helper ? (
            <p className="text-xs text-muted-foreground">{helper}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function VersionHistoryTable({ entries }: { entries: DrugPriceSnapshot[] }) {
  if (!entries.length) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[560px] text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Versioni</th>
            <th className="px-3 py-2 text-right font-medium">Shumicë</th>
            <th className="px-3 py-2 text-right font-medium">Me marzhë</th>
            <th className="px-3 py-2 text-right font-medium">Pakicë</th>
            <th className="px-3 py-2 text-left font-medium">Vlefshmëria</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={`${entry.version}-${entry.valid_until ?? "na"}`}>
              <td className="px-3 py-2 font-medium">{entry.version}</td>
              <td className="px-3 py-2 text-right">
                {priceFormatter(entry.price_wholesale)}
              </td>
              <td className="px-3 py-2 text-right">
                {priceFormatter(entry.price_with_margin)}
              </td>
              <td className="px-3 py-2 text-right">
                {priceFormatter(entry.price_retail)}
              </td>
              <td className="px-3 py-2 text-left">
                {formatDate(entry.valid_until)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReferencePriceSection({ section }: { section: ReferenceSection }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {section.title}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {section.entries.map((entry) => (
          <div
            key={`${section.title}-${entry.label}`}
            className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">{entry.label}</span>
            <span className="font-medium">{priceFormatter(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DrugPriceExplorer({
  recordsDataset,
  versionsDataset,
}: DrugPriceExplorerProps) {
  const [search, setSearch] = React.useState("");
  const [versionFilter, setVersionFilter] = React.useState<string | null>(null);
  const [formFilter, setFormFilter] = React.useState<string | null>(null);
  const [validUntilFilter, setValidUntilFilter] = React.useState<string | null>(
    null,
  );
  const [pageSize, setPageSize] = React.useState<(typeof PAGE_SIZES)[number]>(
    PAGE_SIZES[0],
  );
  const [pageIndex, setPageIndex] = React.useState(0);

  const records = React.useMemo<EnrichedRecord[]>(
    () =>
      recordsDataset.records.map((record, index) => ({
        ...record,
        id: createRecordId(record, index),
        searchText: buildSearchText(record),
      })),
    [recordsDataset.records],
  );

  const sortedVersions = React.useMemo(
    () =>
      [...versionsDataset.versions].sort((a, b) =>
        versionCollator.compare(b.version, a.version),
      ),
    [versionsDataset.versions],
  );

  const versionOptions = React.useMemo(
    () =>
      sortedVersions.map((version) => ({
        value: version.version,
        label: `Versioni ${version.version}`,
        notes: `${formatCount(version.record_count)} produkte`,
      })),
    [sortedVersions],
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

  const validUntilOptions = React.useMemo(() => {
    const values = new Set<string>();
    for (const record of records) {
      if (record.valid_until) {
        values.add(record.valid_until);
      }
    }
    return [...values]
      .sort((a, b) => b.localeCompare(a))
      .map((value) => ({
        value,
        label: formatDate(value, "long"),
      }));
  }, [records]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredRecords = React.useMemo(() => {
    return records.filter((record) => {
      if (normalizedSearch && !record.searchText.includes(normalizedSearch)) {
        return false;
      }
      if (versionFilter && record.latest_version !== versionFilter) {
        return false;
      }
      if (formFilter && record.pharmaceutical_form !== formFilter) {
        return false;
      }
      if (validUntilFilter && record.valid_until !== validUntilFilter) {
        return false;
      }
      return true;
    });
  }, [records, normalizedSearch, versionFilter, formFilter, validUntilFilter]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [normalizedSearch, versionFilter, formFilter, validUntilFilter]);

  React.useEffect(() => {
    setPageIndex((current) => {
      const totalPages = Math.max(
        1,
        Math.ceil(filteredRecords.length / pageSize) || 1,
      );
      return Math.min(current, totalPages - 1);
    });
  }, [filteredRecords.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
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
    (validUntilFilter ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setVersionFilter(null);
    setFormFilter(null);
    setValidUntilFilter(null);
  };

  const totalProducts = records.length;
  const uniqueSubstances = React.useMemo(() => {
    const values = new Set<string>();
    for (const record of records) {
      if (record.active_substance) {
        values.add(record.active_substance);
      }
    }
    return values.size;
  }, [records]);

  const uniqueHolders = React.useMemo(() => {
    const values = new Set<string>();
    for (const record of records) {
      if (record.marketing_authorisation_holder) {
        values.add(record.marketing_authorisation_holder);
      }
    }
    return values.size;
  }, [records]);

  const latestVersion = sortedVersions[0] ?? null;

  const datasetGeneratedAt = formatDateTime(recordsDataset.generated_at);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Ministria e Shëndetësisë · Çmimet referuese
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Barnat e licencuara dhe çmimet e miratuara
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Kërko dhe filtro listën e barnave të importuara ose të prodhuara në
            Kosovë për të parë çmimet me shumicë, marzhën e lejuar dhe çmimin me
            pakicë sipas versioneve të publikuara të Ministrisë së Shëndetësisë.
          </p>
          <p className="text-xs text-muted-foreground">
            Dataseti u gjenerua më {datasetGeneratedAt}. Çdo rresht shfaq çmimet
            më të fundit për produktin përkatës dhe historikun e versioneve.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryStat
            icon={<Pill className="size-5" aria-hidden="true" />}
            label="Produkte të listuara"
            value={formatCount(totalProducts)}
            helper="Çmimet e fundit në euro"
          />
          <SummaryStat
            icon={<Layers3 className="size-5" aria-hidden="true" />}
            label="Substanca aktive"
            value={formatCount(uniqueSubstances)}
            helper="Rreshtat unikë me përbërje"
          />
          <SummaryStat
            icon={<PackageCheck className="size-5" aria-hidden="true" />}
            label="Mbajtësit e autorizimit"
            value={formatCount(uniqueHolders)}
            helper="Operatorë të licencuar"
          />
          <SummaryStat
            icon={<CalendarClock className="size-5" aria-hidden="true" />}
            label="Versioni më i ri"
            value={latestVersion ? latestVersion.version : "n/a"}
            helper={
              latestVersion?.valid_until_values?.length
                ? `Vlefshmëria: ${latestVersion.valid_until_values
                    .map((value) => formatDate(value))
                    .join(", ")}`
                : "Pa datë të raportuar"
            }
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Filtro produktet</h2>
              <p className="text-sm text-muted-foreground">
                Kombino kërkimin me versionin dhe formatin farmaceutik.
              </p>
            </div>
            {appliedFilters > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <RefreshCcw className="size-4" aria-hidden="true" />
                Pastro filtrat
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Kërko produktin</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Emri, substanca ose mbajtësi i autorizimit"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Versioni</label>
              <FilterableCombobox
                value={versionFilter}
                onValueChange={setVersionFilter}
                options={versionOptions}
                placeholder="Të gjitha versionet"
                searchPlaceholder="Kërko versionin..."
                emptyMessage="Nuk u gjet asnjë version"
                triggerClassName="h-10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Forma farmaceutike</label>
              <FilterableCombobox
                value={formFilter}
                onValueChange={setFormFilter}
                options={formOptions}
                placeholder="Të gjitha format"
                searchPlaceholder="Kërko formatin..."
                emptyMessage="Nuk ka përputhje"
                triggerClassName="h-10"
                disabled={!formOptions.length}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">E vlefshme deri</label>
              <NativeSelect
                value={validUntilFilter ?? ""}
                onChange={(event) =>
                  setValidUntilFilter(event.target.value || null)
                }
                className="w-full"
              >
                <NativeSelectOption value="">
                  Të gjitha datat
                </NativeSelectOption>
                {validUntilOptions.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              {appliedFilters > 0
                ? `${appliedFilters} filtra aktiv`
                : "Asnjë filtër aktiv"}
            </div>
            <span>
              Duke shfaqur {startIndex || 0}-{endIndex} nga{" "}
              {formatCount(filteredRecords.length)} produkte.
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Tabela e çmimeve</h3>
              <p className="text-sm text-muted-foreground">
                Çmimet shfaqen në euro dhe përditësohen sipas versionit më të
                fundit të publikuar.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>Rreshta për faqe</span>
                <NativeSelect
                  value={String(pageSize)}
                  onChange={(event) =>
                    setPageSize(
                      Number.parseInt(
                        event.target.value,
                        10,
                      ) as (typeof PAGE_SIZES)[number],
                    )
                  }
                >
                  {PAGE_SIZES.map((size) => (
                    <NativeSelectOption key={size} value={String(size)}>
                      {size}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPageIndex((index) => Math.max(index - 1, 0))
                  }
                  disabled={pageIndex === 0}
                >
                  Më parë
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPageIndex((index) =>
                      Math.min(index + 1, Math.max(totalPages - 1, 0)),
                    )
                  }
                  disabled={pageIndex >= totalPages - 1}
                >
                  Tjetra
                </Button>
              </div>
            </div>
          </div>

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
                                    {priceFormatter(record.price_wholesale)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Me marzhë
                                  </span>
                                  <span className="font-medium">
                                    {priceFormatter(record.price_with_margin)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Pakicë
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {priceFormatter(record.price_retail)}
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
                                  {formatDate(record.valid_until, "long")}
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
                  return (
                    <div
                      key={`${record.id}-card`}
                      className="space-y-3 rounded-lg border bg-card p-4 shadow-sm"
                    >
                      <div>
                        <p className="text-base font-semibold">
                          {record.product_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.active_substance ?? "—"}
                        </p>
                      </div>
                      <dl className="grid gap-3 text-sm">
                        <div className="space-y-0.5">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            ATC
                          </dt>
                          <dd className="font-medium break-words">
                            {record.atc_code ?? "—"}
                          </dd>
                        </div>
                        <div className="space-y-0.5">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Doza
                          </dt>
                          <dd className="font-medium break-words">
                            {record.dose ?? "—"}
                          </dd>
                        </div>
                        <div className="space-y-0.5">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Forma
                          </dt>
                          <dd className="font-medium break-words">
                            {record.pharmaceutical_form ?? "—"}
                          </dd>
                        </div>
                        <div className="space-y-0.5">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Paketimi
                          </dt>
                          <dd className="font-medium break-words">
                            {record.packaging ?? "—"}
                          </dd>
                        </div>
                        <div className="space-y-0.5">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Autoriteti
                          </dt>
                          <dd className="font-medium break-words">
                            {record.marketing_authorisation_holder ?? "—"}
                          </dd>
                        </div>
                        <div className="space-y-0.5">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Vlefshmëria
                          </dt>
                          <dd className="font-medium break-words">
                            {formatDate(record.valid_until, "long")}
                          </dd>
                        </div>
                      </dl>
                      <div className="rounded-md border bg-muted/40 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Shumicë</span>
                          <span className="font-medium">
                            {priceFormatter(record.price_wholesale)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Me marzhë
                          </span>
                          <span className="font-medium">
                            {priceFormatter(record.price_with_margin)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pakicë</span>
                          <span className="font-semibold text-foreground">
                            {priceFormatter(record.price_retail)}
                          </span>
                        </div>
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

      {sortedVersions.length ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Versionet e publikuara</h2>
            <p className="text-sm text-muted-foreground">
              Çdo version përfaqëson një workbook të Ministrisë së Shëndetësisë
              dhe ruan numrin e produkteve të përpunuara.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedVersions.map((version) => (
              <Card key={version.version}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Versioni {version.version}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(version.valid_until_values?.[0])}
                    </span>
                  </div>
                  <CardDescription>
                    {version.record_count
                      ? `${formatCount(version.record_count)} produkte`
                      : "Pa numërim"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Burimi</span>
                    <span className="font-medium">{version.source_file}</span>
                  </div>
                  {version.valid_until_values?.length ? (
                    <div>
                      <p className="text-muted-foreground">Vlefshmëria</p>
                      <ul className="mt-1 text-sm text-foreground">
                        {version.valid_until_values.map((date) => (
                          <li key={`${version.version}-${date}`}>
                            {formatDate(date, "long")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
