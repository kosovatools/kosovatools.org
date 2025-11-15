import { useMemo, type ChangeEvent } from "react";

import { formatNumber } from "@workspace/utils";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { Button } from "@workspace/ui/components/button";
import { FilterableCombobox } from "@workspace/ui/custom-components/filterable-combobox";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";

import type { PositionCoefficient } from "../types";
import type {
  AllowanceFormEntry,
  CalculationMode,
  PolicyFormState,
  PremiumKey,
} from "./types";

const PREMIUM_LABELS: Record<
  PremiumKey,
  { title: string; description: string }
> = {
  on_call: {
    title: "Orë gatishmërie",
    description:
      "Koha jashtë orarit normal kur punonjësi qëndron në gatishmëri.",
  },
  night: {
    title: "Orë nate",
    description: "Orë të punuara ndërmjet 22:00 dhe 06:00.",
  },
  overtime: {
    title: "Orë jashtë orarit",
    description: "Orë shtesë mbi normën javore të punës.",
  },
  weekend: {
    title: "Fundjava",
    description: "Orë të punuara të shtunën ose të dielën.",
  },
  holiday: {
    title: "Festa zyrtare",
    description: "Orë të punuara në ditë pushimi të përcaktuara nga Qeveria.",
  },
};

const coefficientFormatter = (value: number | null | undefined) =>
  formatNumber(
    value,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    },
    { fallback: "—" },
  );

export interface PublicWageCalculatorInputsProps {
  mode: CalculationMode;
  yearsOfService: number;
  coefficientManual: number | "";
  selectedPositionId: string | null;
  selectedSector: string | null;
  coefficientValue: number;
  hours: Record<PremiumKey, number>;
  allowances: AllowanceFormEntry[];
  policy: PolicyFormState;
  availablePositions: PositionCoefficient[];
  onModeChange: (mode: CalculationMode) => void;
  onYearsOfServiceChange: (years: number) => void;
  onSectorChange: (sector: string | null) => void;
  onPositionChange: (positionId: string | null) => void;
  onManualCoefficientChange: (coefficient: number) => void;
  onCoefficientValueChange: (value: number) => void;
  onHoursChange: (key: PremiumKey, value: number) => void;
  onAllowanceAdd: () => void;
  onAllowanceChange: (
    id: string,
    updates: Partial<Pick<AllowanceFormEntry, "label" | "type" | "value">>,
  ) => void;
  onAllowanceRemove: (id: string) => void;
  onPolicyChange: (policy: PolicyFormState) => void;
}

function buildPositionOption(position: PositionCoefficient) {
  const pieces = [position.title, position.institution, position.code].filter(
    Boolean,
  );

  const baseLabel = pieces.join(" • ");
  const rawNotes = position.notes?.trim() ?? "";
  const condensedNotes = rawNotes.replace(/\s+/g, " ").trim();

  const preview =
    condensedNotes.length > 160
      ? `${condensedNotes.slice(0, 157).trimEnd()}…`
      : condensedNotes;

  if (baseLabel) {
    return {
      label: baseLabel,
      notes: preview || undefined,
    };
  }

  if (preview) {
    return {
      label: preview,
      notes: undefined,
    };
  }

  return {
    label:
      position.title ??
      position.institution ??
      position.code ??
      position.sector ??
      position.id,
    notes: undefined,
  };
}

function formatSectorLabel(value: string) {
  const normalized = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return value;
  }

  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function PublicWageCalculatorInputs({
  mode,
  yearsOfService,
  coefficientManual,
  selectedPositionId,
  selectedSector,
  coefficientValue,
  hours,
  allowances,
  policy,
  availablePositions,
  onModeChange,
  onYearsOfServiceChange,
  onSectorChange,
  onPositionChange,
  onManualCoefficientChange,
  onCoefficientValueChange,
  onHoursChange,
  onAllowanceAdd,
  onAllowanceChange,
  onAllowanceRemove,
  onPolicyChange,
}: PublicWageCalculatorInputsProps) {
  const selectedPosition = useMemo(
    () =>
      availablePositions.find(
        (position) => position.id === selectedPositionId,
      ) ?? null,
    [availablePositions, selectedPositionId],
  );

  const sectorFilteredPositions = useMemo(() => {
    if (!selectedSector) {
      return [];
    }

    return availablePositions.filter(
      (position) => position.sector === selectedSector,
    );
  }, [availablePositions, selectedSector]);

  const comboboxOptions = useMemo(
    () =>
      sectorFilteredPositions.map((position) => ({
        value: position.id,
        ...buildPositionOption(position),
        keywords: [
          position.title,
          position.institution ?? "",
          position.code ?? "",
          position.sector,
          position.notes ?? "",
        ].filter(Boolean),
      })),
    [sectorFilteredPositions],
  );

  const selectedOptionDetails = useMemo(() => {
    if (!selectedPosition) {
      return null;
    }

    return buildPositionOption(selectedPosition);
  }, [selectedPosition]);

  const formattedSelectedCoefficient = useMemo(() => {
    if (!selectedPosition) {
      return null;
    }

    return coefficientFormatter(selectedPosition.coefficient);
  }, [selectedPosition]);

  const sectorOptions = useMemo(() => {
    const sectors = new Set<string>();
    for (const position of availablePositions) {
      if (position.sector) {
        sectors.add(position.sector);
      }
    }

    return Array.from(sectors).sort((a, b) => a.localeCompare(b, "sq"));
  }, [availablePositions]);

  const handleHoursChange = (key: PremiumKey) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = parseNumber(event.target.value, 0);
      onHoursChange(key, value >= 0 ? value : 0);
    };
  };

  const handleYearsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10);
    onYearsOfServiceChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
  };

  const handleManualCoefficient = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "") {
      onManualCoefficientChange(0);
      return;
    }

    const parsed = parseNumber(value, 0);
    onManualCoefficientChange(parsed >= 0 ? parsed : 0);
  };

  const handleCoefficientValueChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseNumber(event.target.value, coefficientValue);
    onCoefficientValueChange(parsed > 0 ? parsed : coefficientValue);
  };

  const handleAllowanceChange = (
    id: string,
    field: "label" | "type" | "value",
  ) => {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const updates: Partial<AllowanceFormEntry> = {};
      if (field === "value") {
        const parsed = parseNumber(event.target.value, 0);
        updates.value = parsed >= 0 ? parsed : 0;
      } else if (field === "label") {
        updates.label = event.target.value;
      } else {
        updates.type = event.target.value as AllowanceFormEntry["type"];
      }

      onAllowanceChange(id, updates);
    };
  };

  return (
    <div className="space-y-6">
      <Field>
        <FieldLabel htmlFor="public-wage-coefficient-value">
          Vlera e koeficientit Z (€/njësi)
        </FieldLabel>
        <FieldContent>
          <Input
            id="public-wage-coefficient-value"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={coefficientValue}
            onChange={handleCoefficientValueChange}
          />
        </FieldContent>
        <FieldDescription className="text-xs text-muted-foreground">
          Përditësoni nëse Qeveria miraton një vlerë të re të koeficientit bazë.
        </FieldDescription>
      </Field>
      <FieldSet className="space-y-3">
        <FieldLegend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Zgjidhni mënyrën e llogaritjes
        </FieldLegend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {
              value: "catalog" as CalculationMode,
              title: "Zgjedh nga katalogu",
              description:
                "Kërkoni një pozitë dhe përdorni koeficientin përkatës.",
            },
            {
              value: "manual" as CalculationMode,
              title: "Shkruaj koeficient manual",
              description:
                "Jepni një koeficient C direkt nëse nuk gjendet në katalog.",
            },
          ].map((option) => {
            const isActive = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-muted/40 text-foreground",
                )}
                onClick={() => onModeChange(option.value)}
              >
                <span className="block font-medium">{option.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </FieldSet>

      {mode === "catalog" ? (
        <div className="space-y-4 min-w-0">
          <Field>
            <FieldLabel htmlFor="public-wage-sector">
              Zgjidh sektorin
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id="public-wage-sector"
                value={selectedSector ?? ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const rawValue = event.target.value;
                  const nextSector = rawValue === "" ? null : rawValue;

                  if (!nextSector || selectedPosition?.sector !== nextSector) {
                    onPositionChange(null);
                  }

                  onSectorChange(nextSector);
                }}
              >
                <NativeSelectOption value="">
                  Zgjidhni sektorin
                </NativeSelectOption>
                {sectorOptions.map((sector) => (
                  <NativeSelectOption value={sector} key={sector}>
                    {formatSectorLabel(sector)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldContent>
            <FieldDescription className="text-xs text-muted-foreground">
              Zgjidhni sektorin për të ngushtuar listën e pozitave në katalog.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="public-wage-position">
              Zgjidh pozitën
            </FieldLabel>
            <FieldContent className="min-w-0">
              <FilterableCombobox
                value={selectedPositionId}
                onValueChange={onPositionChange}
                options={comboboxOptions}
                placeholder={
                  selectedSector
                    ? "Zgjidh pozitën..."
                    : "Së pari zgjidhni sektorin"
                }
                searchPlaceholder="Kërkoni sipas titullit, institucionit ose kodit..."
                emptyMessage={
                  selectedSector
                    ? "Asnjë pozitë nuk u gjet."
                    : "Zgjidhni sektorin për të parë listën."
                }
                maxResults={100}
                contentClassName="w-[480px]"
                disabled={!selectedSector || comboboxOptions.length === 0}
              />
            </FieldContent>
            <FieldDescription className="text-xs text-muted-foreground">
              Koeficienti C merret automatikisht nga katalogu. Lista kufizohet
              në 100 rezultate për performancë.
            </FieldDescription>
          </Field>
          {selectedPosition && selectedOptionDetails ? (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Pozita e zgjedhur
                  </p>
                  <p className="mt-1 text-sm font-medium leading-5 text-foreground">
                    {selectedOptionDetails.label}
                  </p>
                  {selectedOptionDetails.notes ? (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {selectedOptionDetails.notes}
                    </p>
                  ) : null}
                </div>
                {formattedSelectedCoefficient ? (
                  <div className="flex flex-col text-right sm:items-end">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Koeficienti C
                    </span>
                    <span className="text-2xl font-semibold text-primary">
                      {formattedSelectedCoefficient}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor="public-wage-coefficient-manual">
            Koeficienti C
          </FieldLabel>
          <FieldContent>
            <Input
              id="public-wage-coefficient-manual"
              inputMode="decimal"
              min={0}
              max={50}
              step="0.001"
              value={coefficientManual === "" ? "" : coefficientManual}
              onChange={handleManualCoefficient}
            />
          </FieldContent>
          <FieldDescription className="text-xs text-muted-foreground">
            Jepni koeficientin brenda intervalit 0–50 me deri në tre shifra pas
            presjes.
          </FieldDescription>
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="public-wage-seniority">
          Vitet e përvojës së punës
        </FieldLabel>
        <FieldContent>
          <Input
            id="public-wage-seniority"
            inputMode="numeric"
            min={0}
            step={1}
            value={yearsOfService}
            onChange={handleYearsChange}
          />
        </FieldContent>
        <FieldDescription className="text-xs text-muted-foreground">
          Përditësohet vetëm me vite të plota; muajt e paplotë nuk merren në
          llogari.
        </FieldDescription>
      </Field>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Orët me shtesa
          </h3>
          <p className="text-xs text-muted-foreground">
            Shkruani numrin e orëve në secilën kategori për muajin e zgjedhur.
            Kalkulatori parandalon mbivendosjen duke i trajtuar secilat kategori
            të ndara.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(PREMIUM_LABELS) as PremiumKey[]).map((key) => {
            const config = PREMIUM_LABELS[key];
            return (
              <Field key={key}>
                <FieldLabel htmlFor={`public-wage-hours-${key}`}>
                  {config.title}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={`public-wage-hours-${key}`}
                    inputMode="numeric"
                    min={0}
                    step="1"
                    value={hours[key] ?? 0}
                    onChange={handleHoursChange(key)}
                  />
                </FieldContent>
                <FieldDescription className="text-xs text-muted-foreground">
                  {config.description}
                </FieldDescription>
              </Field>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Shtesa të tjera mujore
            </h3>
            <p className="text-xs text-muted-foreground">
              Shtoni pagesa shtesë që lidhen me bazën, me bazën plus përvojën,
              me pagën bruto ose shuma fikse.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onAllowanceAdd}
          >
            Shto shtesë
          </Button>
        </div>

        {allowances.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
            Nuk ka shtesa të tjera. Klikoni &ldquo;Shto shtesë&rdquo; për të
            përfshirë kompensime specifike të institucionit.
          </p>
        ) : (
          <div className="space-y-4">
            {allowances.map((allowance) => (
              <div
                key={allowance.id}
                className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
              >
                <Field className="space-y-2">
                  <FieldLabel htmlFor={`allowance-label-${allowance.id}`}>
                    Emërtimi
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={`allowance-label-${allowance.id}`}
                      value={allowance.label}
                      onChange={handleAllowanceChange(allowance.id, "label")}
                      placeholder="p.sh. Shtesë tregu"
                    />
                  </FieldContent>
                </Field>
                <Field className="space-y-2">
                  <FieldLabel htmlFor={`allowance-type-${allowance.id}`}>
                    Lloji i llogaritjes
                  </FieldLabel>
                  <FieldContent>
                    <NativeSelect
                      id={`allowance-type-${allowance.id}`}
                      value={allowance.type}
                      onChange={handleAllowanceChange(allowance.id, "type")}
                    >
                      <NativeSelectOption value="percent_of_base">
                        % e bazës
                      </NativeSelectOption>
                      <NativeSelectOption value="percent_of_base_plus_seniority">
                        % e bazës + përvoja
                      </NativeSelectOption>
                      <NativeSelectOption value="percent_of_gross">
                        % e pagës bruto
                      </NativeSelectOption>
                      <NativeSelectOption value="fixed">
                        Shumë fikse (€)
                      </NativeSelectOption>
                    </NativeSelect>
                  </FieldContent>
                </Field>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Field className="space-y-2">
                    <FieldLabel htmlFor={`allowance-value-${allowance.id}`}>
                      Vlera
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={`allowance-value-${allowance.id}`}
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={
                          Number.isFinite(allowance.value) ? allowance.value : 0
                        }
                        onChange={handleAllowanceChange(allowance.id, "value")}
                      />
                    </FieldContent>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Përqindjet jepen pa simbolin %, p.sh. 5 = 5%.
                    </FieldDescription>
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAllowanceRemove(allowance.id)}
                    >
                      Hiq
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="policy-allowances-base">
            Bazë për orët shtesë
          </FieldLabel>
          <FieldContent>
            <NativeSelect
              id="policy-allowances-base"
              value={policy.allowancesApplyOn}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onPolicyChange({
                  ...policy,
                  allowancesApplyOn: event.target
                    .value as PolicyFormState["allowancesApplyOn"],
                })
              }
            >
              <NativeSelectOption value="base">
                Vetëm paga bazë
              </NativeSelectOption>
              <NativeSelectOption value="base_plus_seniority">
                Pagë bazë + përvoja
              </NativeSelectOption>
            </NativeSelect>
          </FieldContent>
          <FieldDescription className="text-xs text-muted-foreground">
            Përzgjidhni nëse orët me shtesa dhe paga orare duhet të llogariten
            vetëm mbi bazën apo mbi bazën me përvojën.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="policy-stacking">
            Rregulli i grumbullimit të orëve
          </FieldLabel>
          <FieldContent>
            <NativeSelect
              id="policy-stacking"
              value={policy.stacking}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onPolicyChange({
                  ...policy,
                  stacking: event.target.value as PolicyFormState["stacking"],
                })
              }
            >
              <NativeSelectOption value="additive">
                Shto të gjitha (default)
              </NativeSelectOption>
              <NativeSelectOption value="exclusive_highest">
                Vetëm shtesa më e lartë
              </NativeSelectOption>
              <NativeSelectOption value="additive_with_cap">
                Shto me prag maksimal
              </NativeSelectOption>
            </NativeSelect>
          </FieldContent>
          <FieldDescription className="text-xs text-muted-foreground">
            Zgjidhni si trajtohen orët në rast të rregullave të brendshme të
            institucionit.
          </FieldDescription>
        </Field>
      </div>

      {policy.stacking === "additive_with_cap" ? (
        <Field>
          <FieldLabel htmlFor="policy-cap">Pragu maksimal (%)</FieldLabel>
          <FieldContent>
            <Input
              id="policy-cap"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={policy.capPercent ?? 0}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onPolicyChange({
                  ...policy,
                  capPercent: parseNumber(event.target.value, 0),
                })
              }
            />
          </FieldContent>
          <FieldDescription className="text-xs text-muted-foreground">
            Kufiri maksimal i shtesave si përqindje e bazës së zgjedhur. Lëre 0
            për të çaktivizuar.
          </FieldDescription>
        </Field>
      ) : null}
    </div>
  );
}
