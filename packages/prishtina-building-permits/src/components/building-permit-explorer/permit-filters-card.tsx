import * as React from "react";
import { RefreshCcw, Search } from "lucide-react";
import { formatCount, formatCurrency, formatDecimal } from "@workspace/utils";
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
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

import type {
  BuildingPermitsIndex,
  BuildingPermitsYearDataset,
} from "@kosovatools/data";
import { collator, sumRecords, toOptionLabel } from "./helpers";
import { PermitRecordsList } from "./permit-records-list";
import { PermitFootprintMap } from "./permit-footprint-map";

type PermitFiltersCardProps = {
  dataset: BuildingPermitsYearDataset;
  selectedSummary: BuildingPermitsIndex["years"][number];
};

export function PermitFiltersCard({
  dataset,
  selectedSummary,
}: PermitFiltersCardProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [neighbourhood, setNeighbourhood] = React.useState<string>("all");
  const [destination, setDestination] = React.useState<string>("all");
  const filterId = React.useId();

  const neighbourhoodOptions = React.useMemo(() => {
    const values = new Set<string>();
    dataset.records.forEach((record) => {
      if (record.neighbourhood) {
        values.add(toOptionLabel(record.neighbourhood));
      }
    });
    return Array.from(values).sort((a, b) => collator.compare(a, b));
  }, [dataset.records]);

  const destinationOptions = React.useMemo(() => {
    const values = new Set<string>();
    dataset.records.forEach((record) => {
      if (record.destination) {
        values.add(toOptionLabel(record.destination));
      }
    });
    return Array.from(values).sort((a, b) => collator.compare(a, b));
  }, [dataset.records]);

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredRecords = React.useMemo(() => {
    return dataset.records.filter((record) => {
      if (neighbourhood !== "all") {
        if (toOptionLabel(record.neighbourhood ?? "") !== neighbourhood) {
          return false;
        }
      }
      if (destination !== "all") {
        if (toOptionLabel(record.destination ?? "") !== destination) {
          return false;
        }
      }
      if (!normalizedSearch) {
        return true;
      }
      if (normalizedSearch.startsWith("#")) {
        return normalizedSearch.slice(1) === record.permit_number;
      }
      const haystacks = [
        record.permit_number,
        record.owner,
        record.investor,
        record.designer,
        record.destination,
        record.neighbourhood,
        record.document_reference,
        ...(record.site?.parcels.map((parcel) => parcel.reference) ?? []),
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());

      return haystacks.some((value) => value.includes(normalizedSearch));
    });
  }, [dataset.records, neighbourhood, destination, normalizedSearch]);

  const hasFilters =
    normalizedSearch.length > 0 ||
    neighbourhood !== "all" ||
    destination !== "all";
  const showParcels = dataset.records.some(
    (record) => record.site?.parcels.length,
  );
  const showFootprints = dataset.records.some(
    (record) => record.footprints?.length,
  );

  const filteredArea = sumRecords(
    filteredRecords,
    (record) => record.total_floor_area_m2,
  );
  const filteredFees = sumRecords(
    filteredRecords,
    (record) => record.total_fee_eur,
  );

  const handleResetFilters = () => {
    setSearchValue("");
    setNeighbourhood("all");
    setDestination("all");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtro lejet ({dataset.year})</CardTitle>
        <CardDescription>
          Kërko sipas pronarit, lagjes{showParcels ? ", parcelës" : ""} ose
          destinimit për të gjetur lejet në listën e publikuar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldGroup className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor={`${filterId}-neighbourhood`}>
              Lagjja
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id={`${filterId}-neighbourhood`}
                value={neighbourhood}
                onChange={(event) => setNeighbourhood(event.target.value)}
              >
                <NativeSelectOption value="all">
                  Të gjitha lagjet
                </NativeSelectOption>
                {neighbourhoodOptions.map((label) => (
                  <NativeSelectOption key={label} value={label}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${filterId}-destination`}>
              Destinimi
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id={`${filterId}-destination`}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              >
                <NativeSelectOption value="all">
                  Të gjitha destinimet
                </NativeSelectOption>
                {destinationOptions.map((label) => (
                  <NativeSelectOption key={label} value={label}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${filterId}-search`}>Kërko tekst</FieldLabel>
            <FieldContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${filterId}-search`}
                  placeholder={
                    showParcels
                      ? "Pronari, parcela, destinimi..."
                      : "Pronari, investitori, destinimi..."
                  }
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="pl-9"
                />
              </div>
            </FieldContent>
          </Field>
        </FieldGroup>
        <div className="flex flex-col gap-3 border-y border-border/80 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div role="status">
            Duke shfaqur{" "}
            <span className="font-semibold text-foreground">
              {formatCount(filteredRecords.length)}
            </span>{" "}
            nga {formatCount(dataset.record_count)} leje të vitit {dataset.year}
            .
          </div>
          <div className="space-x-4">
            <span>
              Sipërfaqja bruto e kateve:{" "}
              <span className="font-semibold text-foreground">
                {filteredArea > 0 ? `${formatDecimal(filteredArea)} m²` : "—"}
              </span>
            </span>
            <span>
              Tarifa:{" "}
              <span className="font-semibold text-foreground">
                {filteredFees > 0 ? formatCurrency(filteredFees) : "—"}
              </span>
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 self-start md:self-auto"
            onClick={handleResetFilters}
            disabled={!hasFilters}
          >
            <RefreshCcw className="h-4 w-4" />
            Pastro filtrat
          </Button>
        </div>
        {showFootprints && <PermitFootprintMap records={filteredRecords} />}
        <PermitRecordsList
          records={filteredRecords}
          hasFilters={hasFilters}
          year={selectedSummary.year}
        />
      </CardContent>
    </Card>
  );
}
