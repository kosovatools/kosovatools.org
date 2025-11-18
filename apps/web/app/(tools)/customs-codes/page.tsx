import type { Metadata } from "next";

import { CustomsExplorer } from "@workspace/customs-codes";

export const metadata: Metadata = {
  title: "Tarifat Doganore të Kosovës – Shfletues i kodeve HS",
  description:
    "Kërkoni kodet HS të Kosovës, konsultoni normat e doganës, akcizës dhe TVSH-së dhe llogaritni detyrimet e importit në kohë reale.",
  keywords: [
    "tarifa doganore kosovë",
    "kodi hs kosova",
    "dogana e kosovës",
    "akciza importi",
    "TVSH importi",
  ],
  alternates: {
    canonical: "/customs-codes",
  },
  openGraph: {
    type: "article",
    url: "/customs-codes",
    title: "Tarifat Doganore të Kosovës – Shfletues i kodeve HS",
    description:
      "Eksploroni tarifat doganore të Kosovës dhe llogaritni detyrimet e importit sipas kodit HS.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarifat Doganore të Kosovës – Shfletues i kodeve HS",
    description:
      "Një shfletues interaktiv për të kontrolluar tarifat doganore, akcizën dhe TVSH-në në Kosovë.",
  },
};

import { ToolPage } from "@workspace/ui/custom-components/tool-page";

export default function CustomsCodesPage() {
  return (
    <ToolPage
      title="Shfletuesi i tarifave doganore të Republikës së Kosovës"
      description="Kërko dhe shfleto tarifat doganore sipas kodit ose përshkrimit dhe llogarit detyrimet për një vlerë të caktuar. Rezultatet përditësohen në çast ndërsa filtroni."
      footer="Ky aplikacion është jo-zyrtar dhe nuk përfaqëson Doganën e Kosovës; për informata zyrtare referojuni publikimeve të institucionit."
      className="space-y-6"
    >
      <CustomsExplorer />
    </ToolPage>
  );
}
