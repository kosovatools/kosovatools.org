import * as React from "react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

import type { FuelType } from "../lib/car-import-calculator";
import { CAR_IMPORT_CONSTANTS } from "../lib/car-import-calculator";

export interface CarImportTaxesInputsProps {
  vehicleYear: number;
  euroStandard: number;
  fuelType: FuelType;
  engineCapacityCc: number;
  purchasePrice: number;
  shippingCost: number;
  insuranceCost: number;
  declaredCif?: number | null;
  preferentialEuOrigin: boolean;
  isBrandNew: boolean;
  ecoTax: number;
  roadTax: number;
  otherFees: number;
  currentYear: number;
  onVehicleYearChange: (value: number) => void;
  onEuroStandardChange: (value: number) => void;
  onFuelTypeChange: (value: FuelType) => void;
  onEngineCapacityChange: (value: number) => void;
  onPurchasePriceChange: (value: number) => void;
  onShippingCostChange: (value: number) => void;
  onInsuranceCostChange: (value: number) => void;
  onDeclaredCifChange: (value: number | null) => void;
  onPreferentialEuOriginChange: (value: boolean) => void;
  onIsBrandNewChange: (value: boolean) => void;
  onEcoTaxChange: (value: number) => void;
  onRoadTaxChange: (value: number) => void;
  onOtherFeesChange: (value: number) => void;
}

type CheckboxCheckedState = Parameters<
  NonNullable<React.ComponentProps<typeof Checkbox>["onCheckedChange"]>
>[0];

function parseNumber(value: string): number {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

const EURO_OPTIONS = [4, 5, 6, 7] as const;
const DEFAULT_EURO_STANDARD = EURO_OPTIONS[0];

export function CarImportTaxesInputs({
  vehicleYear,
  euroStandard,
  fuelType,
  engineCapacityCc,
  purchasePrice,
  shippingCost,
  insuranceCost,
  declaredCif,
  preferentialEuOrigin,
  isBrandNew,
  ecoTax,
  roadTax,
  otherFees,
  currentYear,
  onVehicleYearChange,
  onEuroStandardChange,
  onFuelTypeChange,
  onEngineCapacityChange,
  onPurchasePriceChange,
  onShippingCostChange,
  onInsuranceCostChange,
  onDeclaredCifChange,
  onPreferentialEuOriginChange,
  onIsBrandNewChange,
  onEcoTaxChange,
  onRoadTaxChange,
  onOtherFeesChange,
}: CarImportTaxesInputsProps) {
  const euroSelectId = React.useId();

  return (
    <div className="space-y-6">
      <section className="grid gap-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">
            Të dhënat bazë të automjetit
          </h2>
          <p className="text-sm text-muted-foreground">
            Verifikoni që automjeti përmbush standardet ligjore të importit:
            maksimumi {CAR_IMPORT_CONSTANTS.MAX_VEHICLE_AGE} vjet dhe standardi
            minimal Euro {CAR_IMPORT_CONSTANTS.MIN_EURO_STANDARD}.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="vehicle-year">
              Viti i regjistrimit të parë
            </FieldLabel>
            <FieldContent>
              <Input
                id="vehicle-year"
                type="number"
                min={currentYear - CAR_IMPORT_CONSTANTS.MAX_VEHICLE_AGE}
                max={currentYear}
                value={Number.isFinite(vehicleYear) ? vehicleYear : currentYear}
                onChange={(event) =>
                  onVehicleYearChange(parseNumber(event.target.value))
                }
              />
            </FieldContent>
            <FieldDescription className="text-xs text-muted-foreground">
              Automjetet më të vjetra se {CAR_IMPORT_CONSTANTS.MAX_VEHICLE_AGE}{" "}
              vjet nuk mund të regjistrohen në Kosovë.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={euroSelectId}>
              Standardi i emetimeve
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id={euroSelectId}
                wrapperClassName="w-full"
                value={`Euro ${euroStandard}`}
                onChange={(event) => {
                  const numericValue = Number.parseInt(
                    event.target.value.replace(/[^0-9]/g, ""),
                    10,
                  );
                  onEuroStandardChange(
                    Number.isFinite(numericValue)
                      ? numericValue
                      : DEFAULT_EURO_STANDARD,
                  );
                }}
              >
                {EURO_OPTIONS.map((option) => (
                  <NativeSelectOption key={option} value={`Euro ${option}`}>
                    Euro {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldContent>
            <FieldDescription className="text-xs text-muted-foreground">
              Ligji për Automjete kërkon së paku Euro{" "}
              {CAR_IMPORT_CONSTANTS.MIN_EURO_STANDARD}.
            </FieldDescription>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="fuel-type">Lloji i karburantit</FieldLabel>
            <FieldContent>
              <NativeSelect
                id="fuel-type"
                wrapperClassName="w-full"
                value={fuelType}
                onChange={(event) =>
                  onFuelTypeChange(event.target.value as FuelType)
                }
              >
                <NativeSelectOption value="petrol">Benzinë</NativeSelectOption>
                <NativeSelectOption value="diesel">Naftë</NativeSelectOption>
                <NativeSelectOption value="hybrid">Hibride</NativeSelectOption>
                <NativeSelectOption value="electric">
                  Elektrike
                </NativeSelectOption>
              </NativeSelect>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="engine-capacity">
              Kubikazhi i motorit (cc)
            </FieldLabel>
            <FieldContent>
              <Input
                id="engine-capacity"
                type="number"
                min={0}
                step={1}
                value={Number.isFinite(engineCapacityCc) ? engineCapacityCc : 0}
                onChange={(event) =>
                  onEngineCapacityChange(
                    Math.max(0, Math.round(parseNumber(event.target.value))),
                  )
                }
              />
            </FieldContent>
            <FieldDescription className="text-xs text-muted-foreground">
              Për automjetet elektrike vendosni 0 cc – akciza nuk aplikohet.
            </FieldDescription>
          </Field>
        </div>
        <Field
          orientation="horizontal"
          className="items-start rounded-lg border border-dashed border-border/70 bg-muted/40 p-4"
        >
          <FieldContent className="flex-none pt-1">
            <Checkbox
              id="brand-new"
              checked={isBrandNew}
              onCheckedChange={(checked: CheckboxCheckedState) =>
                onIsBrandNewChange(checked === true)
              }
            />
          </FieldContent>
          <FieldContent className="space-y-1 text-sm">
            <FieldLabel htmlFor="brand-new" className="font-medium">
              Automjet i ri, i paregjistruar
            </FieldLabel>
            <FieldDescription className="text-xs text-muted-foreground">
              Automjetet e reja të paregjistruara përjashtohen nga akciza sipas
              vendimit qeveritar.
            </FieldDescription>
          </FieldContent>
        </Field>
      </section>

      <section className="grid gap-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">
            Kosto doganore dhe transporti
          </h2>
          <p className="text-sm text-muted-foreground">
            Vlera CIF përbëhet nga çmimi i blerjes, transporti dhe sigurimi.
            Mund të vendosni një vlerë të deklaruar nëse e keni nga faturat.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="purchase-price">
              Çmimi i blerjes (€)
            </FieldLabel>
            <FieldContent>
              <Input
                id="purchase-price"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={Number.isFinite(purchasePrice) ? purchasePrice : 0}
                onChange={(event) =>
                  onPurchasePriceChange(parseNumber(event.target.value))
                }
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="shipping-cost">
              Transporti & ngarkimi (€)
            </FieldLabel>
            <FieldContent>
              <Input
                id="shipping-cost"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={Number.isFinite(shippingCost) ? shippingCost : 0}
                onChange={(event) =>
                  onShippingCostChange(parseNumber(event.target.value))
                }
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="insurance-cost">
              Sigurimi gjatë transportit (€)
            </FieldLabel>
            <FieldContent>
              <Input
                id="insurance-cost"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={Number.isFinite(insuranceCost) ? insuranceCost : 0}
                onChange={(event) =>
                  onInsuranceCostChange(parseNumber(event.target.value))
                }
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="declared-cif">
              Vlera CIF e deklaruar (€)
            </FieldLabel>
            <FieldContent>
              <Input
                id="declared-cif"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={declaredCif ?? ""}
                placeholder="Llogaritet automatikisht nëse lihet bosh"
                onChange={(event) => {
                  const value = event.target.value.trim();
                  if (value === "") {
                    onDeclaredCifChange(null);
                    return;
                  }
                  onDeclaredCifChange(parseNumber(value));
                }}
              />
            </FieldContent>
            <FieldDescription className="text-xs text-muted-foreground">
              Lëreni bosh për të përdorur shumën automatike (blerje + transport
              + sigurim).
            </FieldDescription>
          </Field>
        </div>
        <Field
          orientation="horizontal"
          className="items-start rounded-lg border border-dashed border-border/70 bg-muted/40 p-4"
        >
          <FieldContent className="flex-none pt-1">
            <Checkbox
              id="preferential-origin"
              checked={preferentialEuOrigin}
              onCheckedChange={(checked: CheckboxCheckedState) =>
                onPreferentialEuOriginChange(checked === true)
              }
            />
          </FieldContent>
          <FieldContent className="space-y-1 text-sm">
            <FieldLabel htmlFor="preferential-origin" className="font-medium">
              Origjinë preferenciale BE (MSA)
            </FieldLabel>
            <FieldDescription className="text-xs text-muted-foreground">
              Zbaton normë dogane 0% vetëm nëse posedoni provë origjine (p.sh.
              EUR.1) dhe kodi tarifor është liberalizuar. Përndryshe lëreni të
              çaktivizuar.
            </FieldDescription>
          </FieldContent>
        </Field>
      </section>

      <section className="grid gap-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">
            Tarifat e regjistrimit të vitit të parë
          </h2>
          <p className="text-sm text-muted-foreground">
            Vlerat mund të ndryshojnë sipas komunës. Përdorni këto fusha për t’i
            përshtatur me tarifat lokale.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="eco-tax">Taksa ekologjike (€)</FieldLabel>
            <FieldContent>
              <Input
                id="eco-tax"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={
                  Number.isFinite(ecoTax)
                    ? ecoTax
                    : CAR_IMPORT_CONSTANTS.annualFees.environmentalTax
                }
                onChange={(event) =>
                  onEcoTaxChange(parseNumber(event.target.value))
                }
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="road-tax">
              Taksa e rrugës/registrimit (€)
            </FieldLabel>
            <FieldContent>
              <Input
                id="road-tax"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={
                  Number.isFinite(roadTax)
                    ? roadTax
                    : CAR_IMPORT_CONSTANTS.annualFees.roadTax.defaultPassenger
                }
                onChange={(event) =>
                  onRoadTaxChange(parseNumber(event.target.value))
                }
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="other-fees">
              Tarifa shtesë administrative (€)
            </FieldLabel>
            <FieldContent>
              <Input
                id="other-fees"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={Number.isFinite(otherFees) ? otherFees : 0}
                onChange={(event) =>
                  onOtherFeesChange(parseNumber(event.target.value))
                }
              />
            </FieldContent>
          </Field>
        </div>
      </section>
    </div>
  );
}
