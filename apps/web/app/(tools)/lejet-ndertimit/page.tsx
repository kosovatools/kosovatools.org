import type { Metadata } from "next";

import { BuildingPermitExplorer } from "@workspace/prishtina-building-permits";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";

const title = "Lejet e ndërtimit në Prishtinë";
const description =
  "Shfleto lejet e ndërtimit në Prishtinë që nga viti 2012. Kërko sipas lagjes, krahaso sipërfaqet dhe shiko në hartë konturet e dokumentuara të përdhesës.";

export const metadata: Metadata = {
  title,
  description,
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
    description,
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function PrishtinaBuildingPermitsPage() {
  return (
    <ToolPage
      title={title}
      description={description}
      footer="Komuna e Prishtinës · Drejtoria e Urbanizmit"
    >
      <BuildingPermitExplorer />
    </ToolPage>
  );
}
