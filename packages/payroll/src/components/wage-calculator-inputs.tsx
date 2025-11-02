import * as React from "react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

import type { JobType } from "../lib/wage-calculator";

export type CalculationMode = "grossToNet" | "netToGross";

export interface WageCalculatorInputsProps {
  mode: CalculationMode;
  grossPay: number;
  targetNetPay: number;
  employerPensionRate: number;
  employeePensionRate: number;
  jobType: JobType;
  onModeChange: (value: CalculationMode) => void;
  onGrossPayChange: (value: number) => void;
  onTargetNetPayChange: (value: number) => void;
  onEmployeePensionRateChange: (value: number) => void;
  onEmployerPensionRateChange: (value: number) => void;
  onJobTypeChange: (value: JobType) => void;
}

function WageCalculatorInputs({
  mode,
  grossPay,
  targetNetPay,
  employeePensionRate,
  employerPensionRate,
  jobType,
  onModeChange,
  onGrossPayChange,
  onTargetNetPayChange,
  onEmployeePensionRateChange,
  onEmployerPensionRateChange,
  onJobTypeChange,
}: WageCalculatorInputsProps) {
  const handleNumberChange = (
    callback: (value: number) => void,
  ): React.ChangeEventHandler<HTMLInputElement> => {
    return (event) => {
      const parsedValue = Number.parseFloat(event.target.value);
      callback(Number.isFinite(parsedValue) ? parsedValue : 0);
    };
  };

  return (
    <div className="grid gap-4">
      <FieldSet className="space-y-3">
        <FieldLegend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Zgjidhni llogaritjen
        </FieldLegend>
        <div className="grid grid-cols-1 gap-2 sm:max-w-md sm:grid-cols-2">
          {[
            {
              value: "grossToNet" as CalculationMode,
              label: "Nga bruto në neto",
              description: "Futni pagën bruto për të parë pagën neto.",
            },
            {
              value: "netToGross" as CalculationMode,
              label: "Nga neto në bruto",
              description:
                "Futni pagën neto të synuar për të gjetur pagën bruto.",
            },
          ].map((option) => {
            const isActive = mode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-muted/40 text-foreground",
                )}
                onClick={() => onModeChange(option.value)}
              >
                <span className="block font-medium">{option.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </FieldSet>
      {mode === "grossToNet" ? (
        <Field>
          <FieldLabel htmlFor="gross-pay">Pagë bruto mujore (€)</FieldLabel>
          <FieldContent>
            <Input
              id="gross-pay"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={Number.isFinite(grossPay) ? grossPay : 0}
              onChange={handleNumberChange(onGrossPayChange)}
            />
          </FieldContent>
          <FieldDescription className="text-xs text-muted-foreground">
            Shkruani pagën bruto mujore për të llogaritur pagën neto pas tatimit
            dhe Trustit.
          </FieldDescription>
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="net-target">Pagë neto e synuar (€)</FieldLabel>
          <FieldContent>
            <Input
              id="net-target"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={Number.isFinite(targetNetPay) ? targetNetPay : 0}
              onChange={handleNumberChange(onTargetNetPayChange)}
            />
          </FieldContent>
          <FieldDescription className="text-xs text-muted-foreground">
            Shkruani pagën neto që dëshironi dhe kalkulatori do të tregojë pagën
            bruto të nevojshme.
          </FieldDescription>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="employee-pension">
            Kontributi i punonjësit (%)
          </FieldLabel>
          <FieldContent>
            <Input
              id="employee-pension"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.1"
              value={
                Number.isFinite(employeePensionRate) ? employeePensionRate : 0
              }
              onChange={handleNumberChange(onEmployeePensionRateChange)}
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="employer-pension">
            Kontributi i punëdhënësit (%)
          </FieldLabel>
          <FieldContent>
            <Input
              id="employer-pension"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.1"
              value={
                Number.isFinite(employerPensionRate) ? employerPensionRate : 0
              }
              onChange={handleNumberChange(onEmployerPensionRateChange)}
            />
          </FieldContent>
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        Kontributet ligjore minimale janë 5% + 5%. Vlerat më të ulëta do të
        llogariten si ky minimum.
      </p>
      <Field>
        <FieldLabel htmlFor="job-type">A është ky punësimi kryesor?</FieldLabel>
        <FieldContent>
          <select
            id="job-type"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
            value={jobType}
            onChange={(event) => onJobTypeChange(event.target.value as JobType)}
          >
            <option value="primary">Po, është punësimi im kryesor</option>
            <option value="secondary">Jo, është punë shtesë</option>
          </select>
        </FieldContent>
        <FieldDescription className="text-xs text-muted-foreground">
          Punësimet sekondare tatohen me normë fikse 10% pa shkallët progresive
          të punësimit kryesor.
        </FieldDescription>
      </Field>
    </div>
  );
}

export { WageCalculatorInputs };
