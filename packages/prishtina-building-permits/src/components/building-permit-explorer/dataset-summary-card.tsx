import * as React from "react";
import {
  formatCount,
  formatCurrency,
  formatDate,
  formatDecimal,
} from "@workspace/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

import type {
  BuildingPermitsIndex,
  BuildingPermitsYearDataset,
} from "@workspace/data";
import { sumRecords } from "./helpers";

type DatasetSummaryCardProps = {
  index: BuildingPermitsIndex;
  dataset: BuildingPermitsYearDataset;
  selectedSummary: BuildingPermitsIndex["years"][number];
  sortedYears: BuildingPermitsIndex["years"];
  onYearChange: (year: number) => void;
};

export function DatasetSummaryCard({
  index,
  dataset,
  selectedSummary,
  sortedYears,
  onYearChange,
}: DatasetSummaryCardProps) {
  const totalArea = sumRecords(
    dataset.records,
    (record) => record.total_floor_area_m2,
  );
  const totalFees = sumRecords(
    dataset.records,
    (record) => record.total_fee_eur,
  );

  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Lejet e ndërtimit ({dataset.year})</CardTitle>
          <CardDescription>
            {`Publikuar më ${formatDate(dataset.generated_at, {
              dateStyle: "long",
              timeStyle: "short",
            })}`}
          </CardDescription>
        </div>
        <div className="w-full sm:w-40">
          <NativeSelect
            aria-label="Zgjedh vitin"
            value={String(selectedSummary.year)}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {sortedYears.map((entry) => (
              <NativeSelectOption key={entry.year} value={String(entry.year)}>
                {entry.year}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricStat
            label="Leje të publikuara"
            value={formatCount(dataset.record_count)}
            hint={`Gjeneruar më ${formatDate(index.generated_at)}`}
          />
          <MetricStat
            label="Sipërfaqja totale"
            value={totalArea > 0 ? `${formatDecimal(totalArea)} m²` : "—"}
            hint="Sipas sipërfaqes së kateve të raportuara"
          />
          <MetricStat
            label="Tarifat totale"
            value={totalFees > 0 ? formatCurrency(totalFees) : "—"}
            hint="Tarifa e densitetit + administrative"
          />
        </div>
        <dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          {dataset.sheet_name ? (
            <div>
              <dt className="font-medium text-foreground">Fleta e punës</dt>
              <dd>{dataset.sheet_name}</dd>
            </div>
          ) : null}
          {selectedSummary.header_row ? (
            <div>
              <dt className="font-medium text-foreground">
                Rreshti i titullit
              </dt>
              <dd>Rreshti {selectedSummary.header_row}</dd>
            </div>
          ) : null}
          {selectedSummary.excel_columns?.length ? (
            <div>
              <dt className="font-medium text-foreground">
                Kolonat e Excel-it
              </dt>
              <dd>{selectedSummary.excel_columns.join(", ")}</dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

function MetricStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
