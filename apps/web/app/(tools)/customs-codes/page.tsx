import type { Metadata } from "next";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { CustomsExplorer } from "@workspace/customs-codes";
import { AlertTriangle } from "lucide-react";

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

export default function CustomsCodesPage() {
  return (
    <article className="space-y-10 -mb-3 sm:-mb-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Shfletuesi i Tarifave Doganore të Republikës së Kosovës
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
          Kërkoni dhe shfletoni tarifat doganore sipas kodit, përshkrimit ose
          llogaritni detyrimet për një vlerë të caktuar. Rezultatet përditësohen
          në çast ndërsa filtroni.
        </p>
      </header>

      <section className="[&>*]:rounded-2xl [&>*]:border [&>*]:border-border/70 [&>*]:bg-card/70">
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle aria-hidden className="h-4 w-4" />
            Informacion i rëndësishëm
          </AlertTitle>
          <AlertDescription className="space-y-2 text-xs text-amber-700 sm:text-sm">
            <p>
              Ky aplikacion është jo-zyrtar dhe
              <strong> nuk përfaqëson Doganën e Kosovës</strong>. Të dhënat
              ngarkohen nga burime publike dhe mund të jenë të papërditësuara.
              Për informata zyrtare, referojuni publikimeve zyrtare.
            </p>
          </AlertDescription>
        </Alert>
      </section>

      <CustomsExplorer />
    </article>
  );
}
