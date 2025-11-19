import type { Metadata } from "next";

import { CarImportTaxesCalculator } from "@workspace/car-import-taxes";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";

export const metadata: Metadata = {
  title: "Kalkulatori i taksave të importit të veturave në Kosovë",
  description:
    "Llogarit detyrimet doganore, akcizën, TVSH-në dhe tarifat e para të regjistrimit për importin e veturave në Republikën e Kosovës.",
  keywords: [
    "akciza automjeteve",
    "dogana kosovë",
    "TVSH importi",
    "vetura të përdorura",
    "import makine",
  ],
  alternates: {
    canonical: "/car-import-taxes",
  },
  openGraph: {
    type: "article",
    url: "/car-import-taxes",
    title: "Kalkulatori i taksave të importit të veturave në Kosovë",
    description:
      "Përllogarit TVSH-në, akcizën dhe detyrimet doganore për importin e veturave sipas legjislacionit të Kosovës.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalkulatori i taksave të importit të veturave në Kosovë",
    description:
      "Një kalkulator i plotë për detyrimet doganore të veturave në Kosovë, përfshirë TVSH-në dhe akcizën.",
  },
};

export default function Page() {
  return (
    <ToolPage
      title="Kalkulatori i taksave të importit të veturave në Kosovë"
      description="Llogarit detyrimet doganore, akcizën dhe TVSH-në për automjetet e reja ose të përdorura që importohen në Kosovë."
    >
      <CarImportTaxesCalculator />
    </ToolPage>
  );
}
