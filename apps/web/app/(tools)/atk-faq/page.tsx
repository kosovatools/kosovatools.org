import type { Metadata } from "next";
import { Info } from "lucide-react";

import { AtkFaqExplorer } from "@workspace/atk-faq";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

export const metadata: Metadata = {
  title: "Pyetje të shpeshta të Administratës Tatimore të Kosovës",
  description:
    "Kërko dhe filtro përgjigjet zyrtare të ATK për TVSH-në, deklarimin elektronik, kuponët fiskalë dhe procedurat tatimore.",
  keywords: [
    "ATK",
    "tatime",
    "deklarimi",
    "TVSH",
    "kuponë fiskal",
    "Administrata Tatimore e Kosovës",
  ],
  alternates: {
    canonical: "/atk-faq",
  },
  openGraph: {
    type: "website",
    url: "/atk-faq",
    title: "Pyetje të shpeshta të Administratës Tatimore të Kosovës",
    description:
      "Shfleto bazën e pyetjeve të ATK-së dhe gjej shpejt përgjigje për obligimet tatimore në Kosovë.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pyetje të shpeshta të Administratës Tatimore të Kosovës",
    description:
      "Kërko brenda pyetjeve të ATK për TVSH-në, EDI-në dhe kuponët fiskalë.",
  },
};

export default function AtkFaqPage() {
  return (
    <ToolPage
      title="Pyetje të shpeshta të ATK"
      description="Shfleto bazën e pyetjeve të Administratës Tatimore të Kosovës (ATK) dhe gjej shpejt udhëzimet për deklarim, TVSH dhe kasat fiskale."
      footer="Burimi: Administrata Tatimore e Kosovës"
    >
      <Alert className="bg-muted/40">
        <Info aria-hidden className="text-primary" />
        <AlertTitle>Si funksionon ky mjet?</AlertTitle>
        <AlertDescription className="inline">
          Shfaqim listën e plotë të pyetje/përgjigjeve të ATK (faqja e ATK i
          shfaq vetëm 5 për faqe dhe pa kërkim të mençur). Filtrat heqin numra
          telefoni ose email-e, por nëse duhet hequr diçka tjetër na kontaktoni
          në{" "}
          <a
            href="mailto:contact@kosovatools.org"
            className="text-primary underline underline-offset-4"
          >
            contact@kosovatools.org
          </a>
          . Të dhënat janë publike në faqen zyrtare të ATK-së. Përgjigjet janë
          orientuese; konfirmoni çdo rast me ATK dhe mbani përgjegjësinë për
          vendimet tuaja.
        </AlertDescription>
      </Alert>
      <AtkFaqExplorer />
    </ToolPage>
  );
}
