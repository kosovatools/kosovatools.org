import type { Metadata } from "next";

import { BuildingPermitExplorer } from "@workspace/prishtina-building-permits";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";

const title = "Lejet e ndërtimit në Prishtinë";

export const metadata: Metadata = {
  title,
  description:
    "Shfleto lejet e ndërtimit të publikuara nga Komuna e Prishtinës për vitet 2012–2025. Filtro sipas lagjes, pronarit ose destinimit.",
  keywords: [
    "lejet e ndërtimit",
    "Prishtina",
    "komuna e Prishtinës",
    "urbanizmi",
    "building permits",
  ],
  alternates: {
    canonical: "/lejet-ndertimit",
  },
  openGraph: {
    type: "website",
    url: "/lejet-ndertimit",
    title,
    description:
      "Krahasoni sipërfaqet, tarifat dhe dokumentet zyrtare të lejeve të ndërtimit të publikuara nga Drejtoria e Urbanizmit e Prishtinës.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Filtroni lejet sipas pronarit, projektuesit ose destinimit.",
  },
};

export default function PrishtinaBuildingPermitsPage() {
  return (
    <ToolPage
      title={title}
      description="Shfleto lejet e publikuara nga Komuna e Prishtinës për vitet 2012–2025. Kërko sipas lagjes ose pronarit dhe shiko sipërfaqen, tarifat dhe dokumentet e çdo lejeje."
      footer="Komuna e Prishtinës · Drejtoria e Urbanizmit"
    >
      <BuildingPermitExplorer />
    </ToolPage>
  );
}
