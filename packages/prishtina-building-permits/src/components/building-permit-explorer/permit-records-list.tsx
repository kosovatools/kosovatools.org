import { ChevronDown, ExternalLink, FileText, MapPin } from "lucide-react";
import { formatCurrency, formatDecimal } from "@workspace/utils";
import type { BuildingPermitRecord } from "@kosovatools/data";

const columns =
  "lg:grid-cols-[minmax(0,2fr)_minmax(0,1.15fr)_minmax(7rem,0.8fr)_minmax(7rem,0.7fr)_1.25rem]";
const sourceLink =
  "inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2";

function permitDate(value: string | null) {
  return value?.split("-").reverse().join(".") ?? "—";
}

function area(value: number | null | undefined) {
  return value == null
    ? "—"
    : `${formatDecimal(value, { minimumFractionDigits: 0 })} m²`;
}

export function PermitRecordsList({
  records,
  hasFilters,
  year,
}: {
  records: BuildingPermitRecord[];
  hasFilters: boolean;
  year: number;
}) {
  if (!records.length) {
    return (
      <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {hasFilters
          ? "Asnjë leje nuk përputhet me filtrat e zgjedhur."
          : "Nuk ka të dhëna për t’u shfaqur për këtë vit."}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div
        aria-hidden="true"
        className={`hidden items-center gap-5 border-b bg-muted/50 px-5 py-3 text-xs font-semibold text-muted-foreground lg:grid ${columns}`}
      >
        <span>Leja dhe lagjja</span>
        <span>Investitori</span>
        <span className="text-right">Sipërfaqja bruto</span>
        <span className="text-right">Data e lëshimit</span>
      </div>
      <ul
        aria-label={`Lejet e ndërtimit për vitin ${year}`}
        className="divide-y"
      >
        {records.map((record) => (
          <li key={`${year}-${record.permit_number}`}>
            <details className="group/permit">
              <summary
                className={`relative grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring group-open/permit:bg-muted/35 sm:px-5 lg:items-center lg:gap-5 [&::-webkit-details-marker]:hidden ${columns}`}
              >
                <span className="col-span-2 col-start-1 row-start-1 flex min-w-0 items-start gap-3 pr-6 lg:col-span-1 lg:pr-0">
                  <span className="mt-0.5 shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
                    <span className="sr-only">Leja </span>#
                    {record.permit_number}
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold leading-5">
                      {record.destination || "Leje ndërtimi"}
                    </span>
                    {record.neighbourhood && (
                      <span className="mt-1 flex items-baseline gap-1 text-xs text-muted-foreground">
                        <MapPin
                          aria-hidden="true"
                          className="size-3 shrink-0 self-center"
                        />
                        {record.neighbourhood}
                      </span>
                    )}
                  </span>
                </span>
                <span className="col-span-2 row-start-2 line-clamp-2 min-w-0 break-words text-sm group-open/permit:line-clamp-none lg:col-span-1 lg:col-start-2 lg:row-start-1">
                  <span className="text-xs text-muted-foreground lg:sr-only">
                    Investitori ·{" "}
                  </span>
                  {record.investor || "—"}
                </span>
                <span className="col-start-1 row-start-3 text-sm font-medium tabular-nums lg:col-start-3 lg:row-start-1 lg:text-right">
                  <span className="block text-xs font-normal text-muted-foreground lg:sr-only">
                    Sipërfaqja bruto
                  </span>
                  {area(record.total_floor_area_m2)}
                </span>
                <span className="col-start-2 row-start-3 text-right text-sm tabular-nums lg:col-start-4 lg:row-start-1">
                  <span className="block text-xs text-muted-foreground lg:sr-only">
                    Data e lëshimit
                  </span>
                  {permitDate(record.issuance_date)}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="col-start-2 row-start-1 size-4 justify-self-end text-muted-foreground transition-transform group-open/permit:rotate-180 lg:col-start-5"
                />
              </summary>
              <PermitDetails record={record} />
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return value ? (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value}</dd>
    </div>
  ) : null;
}

function PermitDetails({ record }: { record: BuildingPermitRecord }) {
  const dates =
    record.application_dates ??
    (record.application_date ? [record.application_date] : []);
  return (
    <div className="space-y-5 border-t border-dashed bg-muted/15 px-4 py-5 sm:px-5">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <dl className="grid content-start gap-3">
          <Fact label="Pronari" value={record.owner} />
          <Fact label="Projektuesi" value={record.designer} />
          <Fact label="Etazhiteti" value={record.storeys} />
          <Fact
            label={dates.length > 1 ? "Datat e aplikimit" : "Data e aplikimit"}
            value={dates.map(permitDate).join(", ")}
          />
        </dl>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Tarifat e lejes</h4>
          <dl className="max-w-sm space-y-2 text-sm">
            {(
              [
                ["Densiteti", record.density_fee_eur],
                ["Administrata", record.administrative_fee_eur],
                ["Gjithsej", record.total_fee_eur],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-3 last:border-t last:pt-2 last:font-semibold"
              >
                <dt>{label}</dt>
                <dd className="tabular-nums">{formatCurrency(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="min-w-0 space-y-2">
          <h4 className="text-sm font-semibold">Dokumentet</h4>
          {record.document_reference && (
            <p className="break-words text-xs leading-5 text-muted-foreground">
              {record.document_reference}
            </p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {record.document_url && (
              <a
                href={record.document_url}
                target="_blank"
                rel="noreferrer"
                className={sourceLink}
              >
                <FileText aria-hidden="true" className="size-4" />
                Vendimi
              </a>
            )}
            {record.situation_url && (
              <a
                href={record.situation_url}
                target="_blank"
                rel="noreferrer"
                className={sourceLink}
              >
                <MapPin aria-hidden="true" className="size-4" />
                Situacioni
              </a>
            )}
            {!record.document_url && !record.situation_url && (
              <span className="text-sm text-muted-foreground">
                Pa dokument të lidhur
              </span>
            )}
          </div>
        </div>
      </div>
      {record.site && (
        <section className="space-y-2 border-t pt-4">
          <h4 className="text-sm font-semibold">Sipërfaqja e parcelave</h4>
          <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {record.site.parcels.map((p) => (
              <li key={p.reference}>
                {p.reference} ·{" "}
                <strong className="font-medium tabular-nums">
                  {area(p.area_m2)}
                </strong>
              </li>
            ))}
          </ul>
          <DocumentPage url={record.site.source_url} page={record.site.page} />
        </section>
      )}
      {!!record.footprints?.length && (
        <section className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold">
            Gjurmët e përdhesës së planifikuar
          </h4>
          <ul className="grid gap-3 sm:grid-cols-2">
            {record.footprints.map((f, i) => (
              <li
                key={i}
                className="space-y-2 rounded-lg border bg-background p-3 text-sm"
              >
                <p className="flex justify-between gap-2">
                  <span>Gjurma {i + 1}</span>
                  <strong className="tabular-nums">{area(f.area_m2)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Sipërfaqja e llogaritur nga konturi
                </p>
                <DocumentPage url={f.source_url} page={f.page} />
                <details>
                  <summary className="cursor-pointer text-sm text-primary">
                    Koordinatat e kulmeve
                  </summary>
                  <p className="py-1 text-xs text-muted-foreground">
                    Gjerësia, gjatësia gjeografike (WGS84)
                  </p>
                  {f.geometry.coordinates.map((ring, n) => (
                    <ol
                      key={n}
                      className="list-decimal pl-5 text-xs leading-5 tabular-nums"
                    >
                      {ring.slice(0, -1).map(([lon, lat], j) => (
                        <li key={j}>
                          {lat.toFixed(7)}, {lon.toFixed(7)}
                        </li>
                      ))}
                    </ol>
                  ))}
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DocumentPage({ url, page }: { url: string; page: number }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className={sourceLink}>
      Burimi (faqja {page})
      <ExternalLink aria-hidden="true" className="size-3" />
    </a>
  );
}
