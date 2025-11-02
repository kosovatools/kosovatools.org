import type { Metadata } from "next";

import { WageCalculatorClient } from "./wage-calculator-client";

export const metadata: Metadata = {
  title: "Paga dhe Rroga – Neto në Bruto, Tatimet & Trusti",
  description:
    "Kalkulator i pagave në Kosovë për të llogaritur pagën neto dhe bruto duke marrë parasysh tatimin progresiv dhe kontributet në Trust.",
  keywords: ["paga", "rroga", "neto në bruto", "tatimet", "trusti", "Kosovë"],
  alternates: {
    canonical: "/wage-calculator",
  },
  openGraph: {
    type: "article",
    url: "/wage-calculator",
    title: "Paga dhe Rroga – Neto në Bruto, Tatimet & Trusti",
    description:
      "Llogarisni pagën neto dhe bruto në Kosovë me tatimin progresiv, kontributet në Trust dhe detyrimet e punëdhënësit.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paga dhe Rroga – Neto në Bruto, Tatimet & Trusti",
    description:
      "Kalkulator i plotë i pagave në Kosovë për punëmarrës dhe punëdhënës.",
  },
};

export default function Page() {
  return <WageCalculatorClient />;
}
