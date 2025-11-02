import type { Metadata } from "next";

import { CarImportTaxesClient } from "./car-import-taxes-client";

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
};

export default function Page() {
  return <CarImportTaxesClient />;
}
