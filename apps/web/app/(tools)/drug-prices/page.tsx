import type { Metadata } from "next";

import { DrugPriceExplorer } from "@workspace/drug-prices";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";

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
    <ToolPage
      title="Tabela e çmimeve"
      description="Çmimet shfaqen në euro dhe përditësohen sipas versionit më të fundit të publikuar. Çdo rresht shfaq çmimet më të fundit për produktin përkatës dhe historikun e versioneve."
    >
      <DrugPriceExplorer />
    </ToolPage>
  );
}
