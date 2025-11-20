import type { Metadata } from "next";

import { InflationTracker } from "@workspace/inflation-tracker";

export const metadata: Metadata = {
  title: "Inflacioni në Kosovë – IHÇK, çmimet mesatare dhe kostot e ndërtimit",
  description:
    "Monitoro indeksin e çmimeve të konsumatorit (2015 = 100), ndryshimet mujore të IHÇK-së sipas COICOP, çmimet mesatare vjetore dhe indeksin e kostos së ndërtimit.",
  keywords: [
    "inflacioni kosovë",
    "ihçk",
    "cpi kosovo",
    "indeksi i çmimeve",
    "kosova statistikë",
  ],
  alternates: {
    canonical: "/inflation-tracker",
  },
  openGraph: {
    type: "website",
    url: "/inflation-tracker",
    title:
      "Inflacioni në Kosovë – IHÇK, çmimet mesatare dhe kostot e ndërtimit",
    description:
      "Grafikë interaktive për IHÇK-në mujore, shportën e çmimeve mesatare dhe indeksin tremujor të kostos së ndërtimit në Kosovë.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Inflacioni në Kosovë – IHÇK, çmimet mesatare dhe kostot e ndërtimit",
    description:
      "Analizo IHÇK-në mujore, çmimet mesatare vjetore dhe kostot e ndërtimit për Kosovën.",
  },
};

import { ToolPage } from "@workspace/ui/custom-components/tool-page";

export default function InflationTrackerPage() {
  return (
    <ToolPage
      title="Gjurmuesi i inflacionit dhe kostove në Kosovë"
      description="Vëzhgo IHÇK-në (2015 = 100) me ndryshimet mujore sipas COICOP, krahaso çmimet mesatare vjetore të produkteve dhe analizo indeksin e kostos së ndërtimit."
    >
      <InflationTracker />
    </ToolPage>
  );
}
