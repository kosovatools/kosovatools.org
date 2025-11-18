"use client";

import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  WageCalculatorInputs,
  type WageCalculatorInputsProps,
  WageCalculatorResults,
  type CalculationMode,
  calculateGrossFromNet,
  calculateWageBreakdown,
  type JobType,
} from "@workspace/payroll";
import { formatCurrency, formatPercent } from "@workspace/utils";

const DEFAULT_VALUES: Pick<
  WageCalculatorInputsProps,
  | "grossPay"
  | "targetNetPay"
  | "employeePensionRate"
  | "employerPensionRate"
  | "jobType"
> = {
  grossPay: 650,
  targetNetPay: 550,
  employeePensionRate: 5,
  employerPensionRate: 5,
  jobType: "primary",
};

const DEFAULT_MODE: CalculationMode = "grossToNet";

export function WageCalculatorClient() {
  const [mode, setMode] = useState<CalculationMode>(DEFAULT_MODE);
  const [grossPay, setGrossPay] = useState(DEFAULT_VALUES.grossPay);
  const [targetNetPay, setTargetNetPay] = useState(DEFAULT_VALUES.targetNetPay);
  const [employeePensionRate, setEmployeePensionRate] = useState(
    DEFAULT_VALUES.employeePensionRate,
  );
  const [employerPensionRate, setEmployerPensionRate] = useState(
    DEFAULT_VALUES.employerPensionRate,
  );
  const [jobType, setJobType] = useState<JobType>(DEFAULT_VALUES.jobType);

  const grossBreakdown = useMemo(
    () =>
      calculateWageBreakdown({
        grossPay,
        employeePensionRate,
        employerPensionRate,
        jobType,
      }),
    [grossPay, employeePensionRate, employerPensionRate, jobType],
  );

  const inverseBreakdown = useMemo(
    () =>
      calculateGrossFromNet({
        targetNetPay,
        employeePensionRate,
        employerPensionRate,
        jobType,
      }),
    [targetNetPay, employeePensionRate, employerPensionRate, jobType],
  );

  const activeResult =
    mode === "grossToNet" ? grossBreakdown : inverseBreakdown.breakdown;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
        <Card>
          <CardHeader>
            <CardTitle>Shënoni të dhënat e pagës</CardTitle>
            <CardDescription>
              Zgjidhni nëse po nisni nga paga bruto apo nga paga neto dhe më pas
              përshtatni kontributet në pension sipas nevojës.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WageCalculatorInputs
              mode={mode}
              grossPay={grossPay}
              targetNetPay={targetNetPay}
              employeePensionRate={employeePensionRate}
              employerPensionRate={employerPensionRate}
              jobType={jobType}
              onModeChange={setMode}
              onGrossPayChange={setGrossPay}
              onTargetNetPayChange={setTargetNetPay}
              onEmployeePensionRateChange={setEmployeePensionRate}
              onEmployerPensionRateChange={setEmployerPensionRate}
              onJobTypeChange={setJobType}
            />
          </CardContent>
        </Card>

        <WageCalculatorResults
          result={activeResult}
          inverseResult={mode === "netToGross" ? inverseBreakdown : undefined}
          formatCurrency={(value) => formatCurrency(value)}
          formatPercentage={formatPercent}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Si funksionon tatimi mbi pagat në Kosovë</CardTitle>
          <CardDescription>
            Rregullat më poshtë përmbledhin legjislacionin aktual (Ligji nr.
            05/L-028 për tatimin në të ardhurat, Udhëzimi Administrativ MF
            03/2015 për Trustin). Për raste të veçanta konsultohuni me
            punëdhënësin ose me Administratën Tatimore të Kosovës.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Punëdhënësi dhe punonjësi kontribuojnë secili të paktën 5% të pagës
            bruto në Trustin e Kursimeve të Kosovës. Totali minimal është 10%,
            ndërsa shumave shtesë u mungon detyrimi ligjor, por shumë kompani
            ofrojnë kontribute më të larta për benefite shtesë. Kontributi i
            punonjësit zbritet përpara tatimit, prandaj tatimi mbi të ardhurat
            llogaritet pasi hiqet kjo shumë nga paga bruto.
          </p>
          <p>
            Tatimi progresiv mbi pagat në Kosovë zbatohet sipas kufijve mujorë:
            0% për €0–€250, 8% për pjesën €250.01–€450 dhe 10% për çdo shumë mbi
            €450. Kalkulatori i aplikon automatikisht këto shkallë mbi të
            ardhurat e tatueshme pas kontributit të punonjësit në Trust dhe
            shfaq një tabelë për secilin bllok tatimor.
          </p>
          <p>
            Të ardhurat nga punësimi sekondar tatohen me normë fikse 10% dhe nuk
            përfitojnë nga shkallët progresive të punësimit kryesor. Kalkulatori
            e aplikon këtë automatikisht kur e ndryshoni llojin e punësimit.
            Kontributet e punëdhënësit shfaqen për transparencë, por nuk zbriten
            nga paga juaj neto.
          </p>
          <div className="rounded-lg border border-dashed bg-muted/30 p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Kujdes kur përdorni të dhënat
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>
                Përfitime të tjera (shujta, bonuse, pagesa shtesë) mund të kenë
                trajtim të veçantë tatimor dhe nuk përfshihen këtu.
              </li>
              <li>
                Tatimi i mbajtur në burim regjistrohet çdo muaj; pagat e
                prapambetura ose pagesat njëherëshe mund të krijojnë detyrime
                shtesë.
              </li>
              <li>
                Rezidentët që punojnë jashtë Kosovë ose kontraktorët pa kontratë
                të rregullt duhet të kontrollojnë rregullat për vetë-deklarim te
                ATK.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Këshilla praktike për pagat</CardTitle>
          <CardDescription>
            Shfrytëzoni kalkulatorin për të planifikuar marrëveshje pune dhe
            negociata të pagave.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Përdorni opsionin "Neto në bruto" për të simuluar propozime pagash
            kur punëdhënësi jep ofertën neto. Në këtë mënyrë mund të kontrolloni
            shpejt se sa do të jetë kostoja për punëdhënësin dhe sa tatim
            paguhet.
          </p>
          <p>
            Mbani shënim përqindjet reale të Trustit nga kontrata juaj të punës.
            Disa kompani ofrojnë kontribute më të larta për punonjësin, ndërsa
            të tjera kërkojnë që punonjësi të kontribuojë mbi minimumin 5%.
          </p>
          <p>
            Nëse ndryshon numri i vendeve të punës gjatë vitit, ruani
            fletëpagesat. Në fund të vitit fiskal, ATK kërkon verifikim të të
            ardhurave për rimbursim ose detyrime shtesë. Dokumentet e pagës
            shërbejnë si bazë për kontroll.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Burime të dobishme</CardTitle>
          <CardDescription>
            Dokumentacioni zyrtar dhe udhëzues për tatimin në pagë dhe Trustin e
            Kursimeve të Kosovës.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href="https://www.atk-ks.org/"
                rel="noreferrer"
                target="_blank"
              >
                Administrata Tatimore e Kosovës – Udhëzues për tatimin në pagë
              </a>
            </li>
            <li>
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href="https://www.trusti.org/"
                rel="noreferrer"
                target="_blank"
              >
                Trusti i Kursimeve të Kosovës – Informacione për kontributet
              </a>
            </li>
            <li>
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href="https://gzk.rks-gov.net/ActDocumentDetail.aspx?ActID=10910"
                rel="noreferrer"
                target="_blank"
              >
                Ligji nr. 05/L-028 për Tatimin në të Ardhura Personale
              </a>
            </li>
          </ul>
          <p>
            Për situata specifike (p.sh. kontrata afatshkurtra, punë sezonale,
            pagesa me honorar), kërkoni këshilla profesionale ose konsultoni
            direkt ATK-në.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
