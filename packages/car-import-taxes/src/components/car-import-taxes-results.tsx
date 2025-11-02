import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import type { CarImportTaxesResult } from "../lib/car-import-calculator";

export interface CarImportTaxesResultsProps {
  result: CarImportTaxesResult;
  formatCurrency?: (value: number) => string;
  formatPercentage?: (value: number) => string;
}

const defaultCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const defaultPercentageFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function formatAge(years: number): string {
  return years === 1 ? "1 vit" : `${years} vjet`;
}

export function CarImportTaxesResults({
  result,
  formatCurrency = (value) => defaultCurrencyFormatter.format(value),
  formatPercentage = (value) => defaultPercentageFormatter.format(value),
}: CarImportTaxesResultsProps) {
  return (
    <article className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ligjshmëria e importit</CardTitle>
          <CardDescription>
            Kontrolloni kufizimet ligjore para blerjes së automjetit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {result.eligibility.isEligible ? (
            <p className="text-foreground">
              Automjeti përputhet me kriteret kryesore të importit (moshë{" "}
              {formatAge(result.eligibility.vehicleAgeYears)} dhe standard Euro{" "}
              {result.eligibility.minimumEuroStandard}+).
            </p>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-destructive">
                Automjeti nuk plotëson kushtet për import sipas rregullave
                aktuale.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {result.eligibility.reasons.map((reason: string) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
          <p>
            Moshë e llogaritur: {formatAge(result.eligibility.vehicleAgeYears)}{" "}
            (viti aktual {result.currentYear}).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detyrimet doganore dhe tatimet</CardTitle>
          <CardDescription>
            Llogaritja bazohet në vlerën CIF të deklaruar ose të përllogaritur
            automatikisht.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Vlera CIF</dt>
              <dd className="font-medium text-foreground">
                {formatCurrency(result.cifValue)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                Detyrimi doganor ({formatPercentage(result.customsDuty.rate)})
              </dt>
              <dd className="font-medium text-foreground">
                {formatCurrency(result.customsDuty.amount)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                Akciza{" "}
                {result.excise.bracketLabel
                  ? `(${result.excise.bracketLabel}${
                      result.excise.rateLabel
                        ? ` – ${result.excise.rateLabel}`
                        : ""
                    })`
                  : result.excise.amount === 0
                    ? "(përjashtim)"
                    : ""}
              </dt>
              <dd className="font-medium text-foreground">
                {formatCurrency(result.excise.amount)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                Baza e TVSH-së ({formatCurrency(result.vat.base)}) ×{" "}
                {formatPercentage(result.vat.rate)}
              </dt>
              <dd className="font-medium text-foreground">
                {formatCurrency(result.vat.amount)}
              </dd>
            </div>
          </dl>
          <div className="rounded-lg border border-border/70 bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Totali i taksave të importit</span>
              <span>{formatCurrency(result.importTaxesTotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-muted-foreground">
              <span>Kostoja totale e mbërritjes</span>
              <span>{formatCurrency(result.landingCost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regjistrimi i vitit të parë</CardTitle>
          <CardDescription>
            Përfshin taksat vjetore bazë dhe tarifat shtesë të zgjedhura.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Taksa ekologjike</dt>
              <dd className="font-medium text-foreground">
                {formatCurrency(result.registrationFees.ecoTax)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Taksa rrugore/registrim</dt>
              <dd className="font-medium text-foreground">
                {formatCurrency(result.registrationFees.roadTax)}
              </dd>
            </div>
            {result.registrationFees.otherFees > 0 ? (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Tarifa të tjera</dt>
                <dd className="font-medium text-foreground">
                  {formatCurrency(result.registrationFees.otherFees)}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="rounded-lg border border-border/70 bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Totali i regjistrimit fillestar</span>
              <span>{formatCurrency(result.registrationFees.total)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-muted-foreground">
              <span>Shpenzimi i vitit të parë (me taksat e importit)</span>
              <span>{formatCurrency(result.firstYearTotalOutlay)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kujdes dhe supozime</CardTitle>
          <CardDescription>
            Rregulloret doganore dhe fiskale ndryshojnë – konfirmoni të dhënat
            me doganën ose brokerin tuaj.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {result.assumptions.map((assumption: string) => (
              <li key={assumption}>{assumption}</li>
            ))}
            <li>{result.excise.reason}</li>
          </ul>
        </CardContent>
      </Card>
    </article>
  );
}
