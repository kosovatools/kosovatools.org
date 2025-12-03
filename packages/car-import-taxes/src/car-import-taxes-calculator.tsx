"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CAR_IMPORT_CONSTANTS,
  calculateCarImportTaxes,
  type FuelType,
} from "./lib/car-import-calculator";
import { CarImportTaxesResults } from "./components/car-import-taxes-results";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CarImportTaxesInputs } from "./components/car-import-taxes-inputs";

export function CarImportTaxesCalculator() {
  const [currentYear, setCurrentYear] = useState(2020);
  const [vehicleYear, setVehicleYear] = useState(2020);
  const [euroStandard, setEuroStandard] = useState(6);
  const [fuelType, setFuelType] = useState<FuelType>("petrol");
  const [engineCapacityCc, setEngineCapacityCc] = useState(1998);
  const [purchasePrice, setPurchasePrice] = useState(8000);
  const [shippingCost, setShippingCost] = useState(500);
  const [insuranceCost, setInsuranceCost] = useState(150);
  const [declaredCif, setDeclaredCif] = useState<number | null>(null);
  const [preferentialEuOrigin, setPreferentialEuOrigin] = useState(false);
  const [isBrandNew, setIsBrandNew] = useState(false);
  const [ecoTax, setEcoTax] = useState(
    CAR_IMPORT_CONSTANTS.annualFees.environmentalTax,
  );
  const [roadTax, setRoadTax] = useState(
    CAR_IMPORT_CONSTANTS.annualFees.roadTax.defaultPassenger,
  );
  const [otherFees, setOtherFees] = useState(0);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  const result = useMemo(
    () =>
      calculateCarImportTaxes({
        vehicleYear,
        euroStandard,
        fuelType,
        engineCapacityCc,
        purchasePrice,
        shippingCost,
        insuranceCost,
        declaredCif: declaredCif ?? undefined,
        preferentialEuOrigin,
        isBrandNew,
        ecoTax,
        roadTax,
        otherFees,
        currentYear,
      }),
    [
      declaredCif,
      currentYear,
      ecoTax,
      engineCapacityCc,
      euroStandard,
      fuelType,
      insuranceCost,
      isBrandNew,
      otherFees,
      preferentialEuOrigin,
      purchasePrice,
      roadTax,
      shippingCost,
      vehicleYear,
    ],
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Plotësoni të dhënat e automjetit</CardTitle>
            <CardDescription>
              Përdorni çmimin real të blerjes dhe shpenzimet e transportit për
              të marrë një vlerësim sa më të afërt me procedurat doganore.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CarImportTaxesInputs
              vehicleYear={vehicleYear}
              euroStandard={euroStandard}
              fuelType={fuelType}
              engineCapacityCc={engineCapacityCc}
              purchasePrice={purchasePrice}
              shippingCost={shippingCost}
              insuranceCost={insuranceCost}
              declaredCif={declaredCif}
              preferentialEuOrigin={preferentialEuOrigin}
              isBrandNew={isBrandNew}
              ecoTax={ecoTax}
              roadTax={roadTax}
              otherFees={otherFees}
              currentYear={currentYear}
              onVehicleYearChange={setVehicleYear}
              onEuroStandardChange={setEuroStandard}
              onFuelTypeChange={setFuelType}
              onEngineCapacityChange={setEngineCapacityCc}
              onPurchasePriceChange={setPurchasePrice}
              onShippingCostChange={setShippingCost}
              onInsuranceCostChange={setInsuranceCost}
              onDeclaredCifChange={setDeclaredCif}
              onPreferentialEuOriginChange={setPreferentialEuOrigin}
              onIsBrandNewChange={setIsBrandNew}
              onEcoTaxChange={setEcoTax}
              onRoadTaxChange={setRoadTax}
              onOtherFeesChange={setOtherFees}
            />
          </CardContent>
        </Card>

        <CarImportTaxesResults result={result} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Si llogariten taksat</CardTitle>
          <CardDescription>
            Burim: Ligji për Doganat dhe Akcizat e Republikës së Kosovës, Ligji
            për TVSH-në dhe Ligji për Automjetet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Detyrimi doganor standard është 10% mbi vlerën CIF (çmimi i blerjes
            + transporti + sigurimi). Nëse ofrohet dëshmi origjine preferenciale
            nga BE sipas MSA-së, shumë linja tarifore të automjeteve zbresin në
            0% – verifikoni me TARIK.
          </p>
          <p>
            Akciza për automjetet e përdorura zbatohet si shumë fikse sipas
            kapacitetit të motorit dhe moshës (vendimi qeveritar i 24.03.2015).
            Automjetet e reja të paregjistruara janë të përjashtuara. TVSH 18%
            llogaritet mbi bazën e vlerës doganore me detyrim dhe akcizë.
          </p>
          <p>
            Pas doganimit, regjistrimi fillestar përfshin taksën ekologjike prej
            10 € dhe taksën rrugore tipike prej 40 € për automjete deri në 3.5
            ton. Komunat mund të kenë tarifa shtesë për targa ose shërbime
            administrative.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Burime të dobishme</CardTitle>
          <CardDescription>
            Dokumentacioni zyrtar për procedurat doganore dhe kushtet e
            regjistrimit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href="https://dogana.rks-gov.net/"
                rel="noreferrer"
                target="_blank"
              >
                Dogana e Kosovës – Udhëzuesi për zhdoganimin e automjeteve
              </a>
            </li>
            <li>
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href="https://mpb.rks-gov.net/"
                rel="noreferrer"
                target="_blank"
              >
                Ministria e Punëve të Brendshme – Ligji nr. 05/L-132 për
                automjetet
              </a>
            </li>
          </ul>
          <p>
            Për raste specifike (p.sh. automjete komerciale, import
            profesional), konsultohuni me brokerin doganor ose me zyrën
            përkatëse.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
