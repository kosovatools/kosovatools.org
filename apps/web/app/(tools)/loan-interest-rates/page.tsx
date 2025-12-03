import type { Metadata } from "next";
import { Info } from "lucide-react";

import { LoanInterestDashboard } from "@workspace/loan-interest-tracker";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

export const metadata: Metadata = {
  title: "Normat e interesit për kreditë e reja (CBK)",
  description:
    "Krahaso normat mujore të interesit për kreditë e reja sipas Bankës Qendrore të Kosovës, me ndarje për ekonomitë familjare, korporatat dhe maturitetet e produkteve.",
  keywords: [
    "CBK",
    "normat e interesit",
    "kredia",
    "hipotekë",
    "linjë kreditore",
    "kredi konsumuse",
  ],
  alternates: {
    canonical: "/loan-interest-rates",
  },
  openGraph: {
    type: "website",
    url: "/loan-interest-rates",
    title: "Normat e interesit për kreditë e reja (CBK)",
    description:
      "Vizualizo normat e interesit për kreditë e reja sipas segmentit dhe llojit të kredisë duke përdorur të dhënat mujore të CBK.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Normat e interesit për kreditë e reja (CBK)",
    description:
      "Krahaso normat mujore të interesit për kreditë e reja për ekonomitë familjare dhe korporatat jofinanciare.",
  },
};

export default function LoanInterestRatesPage() {
  return (
    <ToolPage
      title="Normat e interesit për kreditë e reja"
      description="Grafiqe mujore nga Banka Qendrore e Kosovës për kreditë e reja, me ndarje për ekonomitë familjare, korporatat dhe maturitetet e produkteve."
    >
      <Alert className="bg-muted/40">
        <Info aria-hidden className="text-primary" />
        <AlertTitle>Shënim metodologjik</AlertTitle>
        <AlertDescription className="text-sm">
          Seritë fillojnë në janar 2010 (pas ndryshimit të metodologjisë) dhe
          përfshijnë vlera bosh kur CBK lë qeliza të paplotësuara në publikimin
          origjinal.
        </AlertDescription>
      </Alert>
      <LoanInterestDashboard />
    </ToolPage>
  );
}
