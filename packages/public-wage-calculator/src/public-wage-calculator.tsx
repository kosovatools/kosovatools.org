"use client";

import { useMemo, useState } from "react";

import {
  COEFFICIENT_CATALOG,
} from "./data/catalog";
import {
  DEFAULT_COEFFICIENT_VALUE,
} from "./config";
import {
  PublicWageCalculatorInputs,
} from "./components/public-wage-calculator-inputs";
import {
  PublicWageCalculatorResults,
} from "./components/public-wage-calculator-results";
import {
  calculatePublicWage,
} from "./lib/public-wage-calculator";
import {
  type AllowanceFormEntry,
  type PremiumKey,
  type PolicyFormState,
  type CalculationMode as PublicWageCalculationMode,
} from "./components/types";
import { formatCount, formatCurrency } from "@workspace/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

const DEFAULT_POLICY: PolicyFormState = {
  allowancesApplyOn: "base",
  stacking: "additive",
  capPercent: 0,
};

const PREMIUM_KEYS: PremiumKey[] = [
  "on_call",
  "night",
  "overtime",
  "weekend",
  "holiday",
];

function createEmptyAllowance(): AllowanceFormEntry {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return {
    id,
    label: "",
    type: "percent_of_base",
    value: 0,
  };
}

export function PublicWageCalculator() {
  const defaultPosition = COEFFICIENT_CATALOG[0] ?? null;
  const defaultSector = defaultPosition?.sector ?? null;
  const defaultPositionId = defaultPosition?.id ?? null;
  const [coefficientValue, setCoefficientValue] = useState(
    DEFAULT_COEFFICIENT_VALUE,
  );
  const [mode, setMode] = useState<PublicWageCalculationMode>("catalog");
  const [yearsOfService, setYearsOfService] = useState(5);
  const [selectedSector, setSelectedSector] = useState<string | null>(
    defaultSector,
  );
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(
    defaultPositionId,
  );
  const [manualCoefficient, setManualCoefficient] = useState(5.6);
  const [hours, setHours] = useState<Record<PremiumKey, number>>(() =>
    PREMIUM_KEYS.reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      {} as Record<PremiumKey, number>,
    ),
  );
  const [allowances, setAllowances] = useState<AllowanceFormEntry[]>([]);
  const [policy, setPolicy] = useState(DEFAULT_POLICY);

  const selectedPosition = useMemo(
    () =>
      COEFFICIENT_CATALOG.find((entry) => entry.id === selectedPositionId) ??
      null,
    [selectedPositionId],
  );

  const { result, error } = useMemo(() => {
    try {
      if (mode === "catalog" && !selectedPositionId) {
        return {
          result: null,
          error: null,
        };
      }

      const allowanceInputs = allowances
        .filter((item) => item.label.trim().length > 0 || item.value > 0)
        .map((item) => ({
          label: item.label.trim() || "Shtesë pa emër",
          type: item.type,
          value: item.value,
        }));

      const hoursInput = PREMIUM_KEYS.reduce(
        (acc, key) => {
          acc[key] = hours[key] ?? 0;
          return acc;
        },
        {} as Record<PremiumKey, number>,
      );

      const policies = {
        allowances_apply_on: policy.allowancesApplyOn,
        stacking: policy.stacking,
        cap_percent:
          policy.stacking === "additive_with_cap" && policy.capPercent
            ? policy.capPercent
            : undefined,
      } as const;

      const payload = {
        coefficient_id:
          mode === "catalog" ? (selectedPositionId ?? undefined) : undefined,
        coefficient_manual: mode === "manual" ? manualCoefficient : undefined,
        coefficient_value_override: coefficientValue,
        years_of_service: yearsOfService,
        hours: hoursInput,
        other_allowances: allowanceInputs,
        policies,
      };

      const calcResult = calculatePublicWage(payload);

      return { result: calcResult, error: null };
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nuk mund të përpunohet kërkesa.";
      return { result: null, error: message };
    }
  }, [
    allowances,
    hours,
    manualCoefficient,
    mode,
    coefficientValue,
    policy.capPercent,
    policy.stacking,
    policy.allowancesApplyOn,
    selectedPositionId,
    yearsOfService,
  ]);

  const handleHoursUpdate = (key: PremiumKey, value: number) => {
    setHours((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAllowanceAdd = () => {
    setAllowances((prev) => [...prev, createEmptyAllowance()]);
  };

  const handleAllowanceChange = (
    id: string,
    updates: Partial<AllowanceFormEntry>,
  ) => {
    setAllowances((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            ...updates,
          }
          : item,
      ),
    );
  };

  const handleAllowanceRemove = (id: string) => {
    setAllowances((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Futni të dhënat</CardTitle>
            <CardDescription>
              Zgjidhni vitin, muajin dhe pozitën ose shënoni koeficientin manual
              për të përllogaritur pagën bazë dhe shtesat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublicWageCalculatorInputs
              mode={mode}
              yearsOfService={yearsOfService}
              coefficientManual={manualCoefficient}
              selectedPositionId={selectedPositionId}
              coefficientValue={coefficientValue}
              hours={hours}
              allowances={allowances}
              policy={policy}
              availablePositions={COEFFICIENT_CATALOG}
              onModeChange={setMode}
              onYearsOfServiceChange={setYearsOfService}
              selectedSector={selectedSector}
              onSectorChange={(sector) => {
                setSelectedSector(sector);
                if (!sector) {
                  setSelectedPositionId(null);
                  return;
                }

                setSelectedPositionId((prev) => {
                  if (!prev) {
                    return prev;
                  }

                  const existing = COEFFICIENT_CATALOG.find(
                    (entry) => entry.id === prev,
                  );

                  if (existing && existing.sector === sector) {
                    return prev;
                  }

                  return null;
                });
              }}
              onPositionChange={setSelectedPositionId}
              onManualCoefficientChange={setManualCoefficient}
              onCoefficientValueChange={setCoefficientValue}
              onHoursChange={handleHoursUpdate}
              onAllowanceAdd={handleAllowanceAdd}
              onAllowanceChange={handleAllowanceChange}
              onAllowanceRemove={handleAllowanceRemove}
              onPolicyChange={setPolicy}
            />
            {error ? (
              <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <PublicWageCalculatorResults
          result={error ? null : result}
          selectedPosition={mode === "catalog" ? selectedPosition : null}
          policy={policy}
          formatCurrency={formatCurrency}
          formatNumber={(value) => formatCount(value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rreth koeficientëve dhe llogaritjeve</CardTitle>
          <CardDescription>
            Shënime orientuese për mënyrën si llogaritet paga bruto sipas Ligjit
            për Pagat në sektorin publik.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Paga bazë mujore është produkt i koeficientit C të pozitës dhe
            vlerës Z të miratuar me Ligjin për Buxhet. Përvoja në punë
            llogaritet me +0.25% për çdo vit deri në 15 vite dhe +0.5% për çdo
            vit shtesë, duke u llogaritur vetëm mbi vitet e plota të punës.
          </p>
          <p>
            Orët e punës për një muaj konsiderohen si 8 orë për çdo ditë pune (H
            = 8 × ditët e punës). Festat zyrtare dhe ditët e fundjavës
            përjashtohen automatikisht. Paga orare bazë shërben për të
            përllogaritur shtesat për orë nate, gatishmëri, fundjavë dhe festë,
            sipas normave ligjore.
          </p>
          <p>
            Shtesat mujore shtesë mund të shprehen si përqindje e pagës bazë, e
            pagës bashkë me përvojën, e pagës bruto totale ose si shuma fikse.
            Kur shtesat varen nga paga bruto, kalkulatori zgjidh ekuacionin në
            mënyrë që të shmangë llogaritjen rrethore.
          </p>
          <div className="rounded-lg border border-dashed bg-muted/30 p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Kujdes dhe transparencë
            </h2>
            <ul className={cn("mt-2 list-disc space-y-1 pl-5 text-sm")}>
              <li>
                Rezultatet vlejnë vetëm për periudhën e zgjedhur dhe nuk
                përfshijnë tatimet apo kontributet për Trustin.
              </li>
              <li>
                Ndryshimet në koeficientët ose vlerën Z kërkojnë përditësim të
                skedarëve të të dhënave të publikuar në këtë projekt.
              </li>
              <li>
                Konfirmoni gjithnjë shumat me zyrën e burimeve njerëzore përpara
                nënshkrimit të kontratave ose përllogaritjes së pagave
                retroaktive.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
