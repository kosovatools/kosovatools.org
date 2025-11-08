import type { Metadata } from "next";

import { DrugPriceExplorer } from "@workspace/drug-prices";
import ReactQueryProvider from "@/components/react-query-provider";

export const metadata: Metadata = {
  title: "Çmimet e barnave të Ministrisë së Shëndetësisë",
  description:
    "Shfleto listën zyrtare të barnave të licencuara në Kosovë, krahaso çmimet me shumicë/pakicë dhe ndiq historikun e versioneve të publikimeve të Ministrisë së Shëndetësisë.",
  keywords: [
    "barnat kosovë",
    "çmimet e barnave",
    "ministria e shëndetësisë",
    "kosova drug prices",
    "mh drug prices",
  ],
  alternates: {
    canonical: "/drug-prices",
  },
  openGraph: {
    type: "website",
    url: "/drug-prices",
    title: "Çmimet e barnave të Ministrisë së Shëndetësisë",
    description:
      "Analizo çmimet referuese të barnave, autorizimet dhe versionet e shkarkuara nga Ministria e Shëndetësisë.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Çmimet e barnave të Ministrisë së Shëndetësisë",
    description:
      "Kërko çmimet me shumicë dhe me pakicë, krahaso versionet dhe referencat rajonale për çdo produkt farmaceutik.",
  },
};

export default function DrugPricesPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Ministria e Shëndetësisë · Çmimet referuese
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Barnat e licencuara dhe çmimet e miratuara
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Kërko dhe filtro listën e barnave të importuara ose të prodhuara në
            Kosovë për të parë çmimet me shumicë, marzhën e lejuar dhe çmimin me
            pakicë sipas versioneve të publikuara të Ministrisë së Shëndetësisë.
          </p>
          <p className="text-xs text-muted-foreground">
            Të dhënat rifreskohen pas çdo publikimi të ri dhe janë të
            disponueshme për ta ndarë si lidhje me filtrat aktivë.
          </p>
        </header>
      </section>
      <ReactQueryProvider>
        <DrugPriceExplorer />
      </ReactQueryProvider>
    </div>
  );
}
