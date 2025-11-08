import type { Metadata } from "next";

import { BuildingPermitExplorer } from "@workspace/prishtina-building-permits";
import ReactQueryProvider from "@/components/react-query-provider";

export const metadata: Metadata = {
  title: "Lejet e ndërtimit të Komunës së Prishtinës",
  description:
    "Shfleto lejet zyrtare të ndërtimit nga Komuna e Prishtinës (2012‑2025), filtro sipas lagjes, pronarit ose destinimit",
  keywords: [
    "lejet e ndërtimit",
    "Prishtina",
    "komuna e Prishtinës",
    "urbanizmi",
    "building permits",
  ],
  alternates: {
    canonical: "/prishtina-building-permits",
  },
  openGraph: {
    type: "website",
    url: "/prishtina-building-permits",
    title: "Lejet e ndërtimit të Komunës së Prishtinës",
    description:
      "Krahasoni sipërfaqet, tarifat dhe dokumentet zyrtare të lejeve të ndërtimit të publikuara nga Drejtoria e Urbanizmit e Prishtinës.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lejet e ndërtimit të Komunës së Prishtinës",
    description:
      "Filtroni lejet sipas pronarit, projektuesit ose destinimit.",
  },
};

export default function PrishtinaBuildingPermitsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Komuna e Prishtinës · Drejtoria e Urbanizmit
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Lejet zyrtare të ndërtimit (2012‑2025)
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Analizo regjistrin e plotë të lejeve të ndërtimit të publikuara nga
            Komuna e Prishtinës për të parë sipërfaqet, tarifat dhe dokumentet
            shoqëruese për çdo aplikim.
          </p>
        </header>
      </section>
      <ReactQueryProvider>
        <BuildingPermitExplorer />
      </ReactQueryProvider>
    </div>
  );
}
