import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { formatNumber as formatNumberIntl } from "@workspace/utils";

import type {
  CalcResponse,
  OtherAllowanceInput,
  PositionCoefficient,
  PremiumBreakdown,
} from "../types";
import type { PolicyFormState } from "./types";

type PremiumKey = keyof PremiumBreakdown;

export interface PublicWageCalculatorResultsProps {
  result: CalcResponse | null;
  selectedPosition: PositionCoefficient | null;
  policy: PolicyFormState;
  formatCurrency: (value: number) => string;
  formatNumber?: (value: number) => string;
}

const PREMIUM_ORDER: PremiumKey[] = [
  "on_call",
  "night",
  "overtime",
  "weekend",
  "holiday",
];

const PREMIUM_DETAILS: Record<
  PremiumKey,
  { label: string; description: string; ratePercent: number }
> = {
  on_call: {
    label: "Gatishmëri",
    description:
      "Orë të qëndrimit në dispozicion llogariten me 20% të pagës orare bazë.",
    ratePercent: 20,
  },
  night: {
    label: "Orë nate",
    description:
      "Orët ndërmjet 22:00–06:00 paguhen me shtesë 30% ndaj pagës orare bazë.",
    ratePercent: 30,
  },
  overtime: {
    label: "Orë jashtë orarit",
    description: "Orët mbi normën javore shtohen me 30% të pagës orare bazë.",
    ratePercent: 30,
  },
  weekend: {
    label: "Fundjava",
    description:
      "Orët e punuara të shtunën ose të dielën rriten me 50% ndaj pagës orare bazë.",
    ratePercent: 50,
  },
  holiday: {
    label: "Festa zyrtare",
    description:
      "Orët në ditë pushimi zyrtar paguhen me shtesë 50% të pagës orare bazë.",
    ratePercent: 50,
  },
};

const ALLOWANCE_TYPE_DESCRIPTIONS: Record<OtherAllowanceInput["type"], string> =
  {
    percent_of_base: "Përqindje e pagës bazë",
    percent_of_base_plus_seniority: "Përqindje e pagës bazë + përvojës",
    percent_of_gross:
      "Përqindje e pagës bruto (llogaritet pas shtesave të tjera)",
    fixed: "Shumë fikse mujore",
  };

function formatPolicySummary(policy: PolicyFormState) {
  switch (policy.stacking) {
    case "exclusive_highest":
      return "Vetëm shtesa më e lartë merret parasysh për këtë muaj.";
    case "additive_with_cap":
      return `Shtesat janë kumulative deri në ${policy.capPercent ?? 0}% të bazës së zgjedhur.`;
    default:
      return "Të gjitha shtesat orare shtohen sipas normave përkatëse.";
  }
}

export function PublicWageCalculatorResults({
  result,
  selectedPosition,
  policy,
  formatCurrency,
  formatNumber = (value) => formatNumberIntl(value),
}: PublicWageCalculatorResultsProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rezultatet</CardTitle>
          <CardDescription>
            Plotësoni fushat në të majtë për të parë përllogaritjet e pagës
            bruto mujore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Kalkulatori do të shfaqë pagën bazë, shtesën e përvojës, shtesat
            sipas orëve dhe çdo kompensim tjetër mujor sapo të keni furnizuar
            koeficientin dhe vitin e duhur.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { breakdown, resolved, totals } = result;
  const premiumEntries = PREMIUM_ORDER.map((key) => ({
    key,
    amount: breakdown.premiums[key],
  })).filter((entry) => entry.amount > 0.009);

  const hasPremiumEntries = premiumEntries.length > 0;
  const hasAllowances = breakdown.other_allowances.length > 0;
  const allowanceInputs = result.inputs.other_allowances ?? [];
  const matchedAllowanceIndices = new Set<number>();
  const allowancesWithSource = breakdown.other_allowances.map((item) => {
    const matchingIndex = allowanceInputs.findIndex((input, index) => {
      if (matchedAllowanceIndices.has(index)) {
        return false;
      }
      return input.label === item.label;
    });

    if (matchingIndex >= 0) {
      matchedAllowanceIndices.add(matchingIndex);
      return {
        amount: item.amount,
        label: item.label,
        source: allowanceInputs[matchingIndex],
      };
    }

    return {
      amount: item.amount,
      label: item.label,
      source: undefined,
    };
  });

  const baseReferenceValue =
    policy.allowancesApplyOn === "base_plus_seniority"
      ? breakdown.base + breakdown.seniority_amount
      : breakdown.base;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Përmbledhje mujore</CardTitle>
          <CardDescription>
            Përditësohet automatikisht sipas koeficientit C dhe përvojës së
            shënuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Paga bazë (C × Z)
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(breakdown.base)}
              </p>
              <p className="text-xs text-muted-foreground">
                C = {resolved.coefficient_C.toFixed(3)}, Z ={" "}
                {formatCurrency(resolved.coefficient_value_Z)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Përvoja ({breakdown.seniority_percent.toFixed(2)}%)
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(breakdown.seniority_amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Llogaritur për {formatNumber(result.inputs.years_of_service)}{" "}
                vite pune.
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Paga orare bazë
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(breakdown.hourly_base)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Llogaritur mbi {resolved.working_hours_H} orë pune standarde në
                muaj.
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatPolicySummary(policy)}
            </p>
          </div>

          {hasPremiumEntries ? (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Shtesat nga orët
                </h3>
                <ul className="space-y-2 text-sm">
                  {premiumEntries.map((entry) => (
                    <li
                      key={entry.key}
                      className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2"
                    >
                      <span className="font-medium">
                        {PREMIUM_DETAILS[entry.key].label}
                      </span>
                      <span>{formatCurrency(entry.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Shtesa të tjera
            </h3>
            {hasAllowances ? (
              <ul className="space-y-2 text-sm">
                {breakdown.other_allowances.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2"
                  >
                    <span>{item.label}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nuk ka shtesa të tjera për këtë konfigurim.
              </p>
            )}
          </div>

          <Separator />

          <div className="flex items-baseline justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">
                Totali bruto
              </p>
              <p className="mt-1 text-2xl font-semibold text-primary">
                {formatCurrency(totals.gross)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Shuma përfshin pagën bazë, përvojën dhe të gjitha shtesat mujore.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Si ndikojnë hyrjet</CardTitle>
          <CardDescription>
            Formula bazë për secilën hyrje duke përfshirë koeficientin, orët dhe
            shtesat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">Koeficienti dhe Z</h3>
            <p>
              Koeficienti C = {resolved.coefficient_C.toFixed(3)} dhe vlera Z ={" "}
              {formatCurrency(resolved.coefficient_value_Z)} japin pagën bazë
              mujore: {formatCurrency(breakdown.base)} (C × Z).
            </p>
            {selectedPosition ? (
              <p>
                Pozita e zgjedhur "{selectedPosition.title}"
                {selectedPosition.institution
                  ? ` në ${selectedPosition.institution}`
                  : ""}{" "}
                mban koeficientin {selectedPosition.coefficient.toFixed(3)}{" "}
                sipas katalogut.
              </p>
            ) : null}
          </section>

          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">Përvoja në punë</h3>
            <p>
              {formatNumber(result.inputs.years_of_service)} vite pune shtojnë{" "}
              {breakdown.seniority_percent.toFixed(2)}% të pagës bazë, që
              përkthehet në {formatCurrency(breakdown.seniority_amount)} dhe
              rrit pagën referuese për shtesat në{" "}
              {formatCurrency(baseReferenceValue)}.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Orët me shtesa</h3>
            {hasPremiumEntries ? (
              <>
                {PREMIUM_ORDER.map((key) => {
                  const hours = result.inputs.hours?.[key] ?? 0;
                  const details = PREMIUM_DETAILS[key];
                  const amount = breakdown.premiums[key];
                  if (!hours && amount < 0.01) {
                    return null;
                  }
                  const expected =
                    breakdown.hourly_base * hours * (details.ratePercent / 100);
                  const adjusted =
                    Math.abs(expected - amount) > 0.05
                      ? " (pas kufizimeve të politikave të shtesave)"
                      : "";

                  return (
                    <p key={key}>
                      {details.label}: {formatNumber(hours)} orë ×{" "}
                      {formatCurrency(breakdown.hourly_base)} ×{" "}
                      {details.ratePercent.toFixed(0)}% ={" "}
                      {formatCurrency(amount)}
                      {adjusted}. {details.description}
                    </p>
                  );
                })}
                <p>{formatPolicySummary(policy)}</p>
              </>
            ) : (
              <p>
                Nuk janë deklaruar orë shtesë për këtë muaj; totali bruto
                mbështetet vetëm në pagën bazë, përvojën dhe shtesat e tjera
                mujore.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Shtesat e tjera</h3>
            {allowancesWithSource.length === 0 ? (
              <p>
                Nuk janë shtuar kompensime shtesë përtej orëve të paguara me
                shtesë.
              </p>
            ) : (
              allowancesWithSource.map((item) => {
                const valueText = item.source
                  ? item.source.type === "fixed"
                    ? formatCurrency(item.source.value)
                    : `${formatNumberIntl(
                        item.source.value,
                        {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 0,
                        },
                        { fallback: "—" },
                      )}%`
                  : null;
                const baseText = item.source
                  ? ALLOWANCE_TYPE_DESCRIPTIONS[item.source.type]
                  : "Shtesë e zgjidhur sipas konfigurimit";
                return (
                  <p key={item.label}>
                    {item.label}: {baseText}
                    {valueText ? ` (${valueText})` : ""} ={" "}
                    {formatCurrency(item.amount)}.
                  </p>
                );
              })
            )}
          </section>
        </CardContent>
      </Card>

      {selectedPosition ? (
        <Card>
          <CardHeader>
            <CardTitle>Detajet e pozitës</CardTitle>
            <CardDescription>
              Informacione të shkurtëra nga katalogu i koeficientëve publik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Titulli: </span>
              <span>{selectedPosition.title}</span>
            </div>
            {selectedPosition.institution ? (
              <div>
                <span className="font-medium">Institucioni: </span>
                <span>{selectedPosition.institution}</span>
              </div>
            ) : null}
            <div>
              <span className="font-medium">Sektori: </span>
              <span>{selectedPosition.sector}</span>
            </div>
            {selectedPosition.code ? (
              <div>
                <span className="font-medium">Kodi: </span>
                <span>{selectedPosition.code}</span>
              </div>
            ) : null}
            {selectedPosition.effective ? (
              <div>
                <span className="font-medium">Efektive nga: </span>
                <span>{selectedPosition.effective.from}</span>
                {selectedPosition.effective.to ? (
                  <span>{` deri më ${selectedPosition.effective.to}`}</span>
                ) : null}
              </div>
            ) : null}
            {selectedPosition.notes ? (
              <p className="rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                {selectedPosition.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
