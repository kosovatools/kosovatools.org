import type { Metadata } from "next";

import { WageCalculatorClient } from "./wage-calculator-client";

export const metadata: Metadata = {
  title: "Paga dhe Rroga – Neto në Bruto, Tatimet & Trusti",
  description:
    "Kalkulator i pagave në Kosovë për të llogaritur pagën neto dhe bruto duke marrë parasysh tatimin progresiv dhe kontributet në Trust.",
  keywords: ["paga", "rroga", "neto në bruto", "tatimet", "trusti", "Kosovë"],
};

export default function Page() {
  return <WageCalculatorClient />;
}
