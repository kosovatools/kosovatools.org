import type { Metadata } from "next";

import {
  cpiDataset,
  formatGeneratedAt,
  getDatasetCoverageLabel,
} from "@workspace/kas-data";

import { InflationTracker } from "@workspace/inflation-tracker";

export const metadata: Metadata = {
  title: "Indeksi i Çmimeve për Konsumatorin – Vizualizime mujore",
  description:
    "Eksploro indeksin e çmimeve (2015 = 100) dhe ndryshimet mujore të IHÇK-së sipas grupeve COICOP në Kosovë.",
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
    title: "Indeksi i Çmimeve për Konsumatorin – Vizualizime mujore",
    description:
      "Grafikë interaktive për indeksin e çmimeve dhe ndryshimet mujore sipas grupeve COICOP në Kosovë.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indeksi i Çmimeve për Konsumatorin – Vizualizime mujore",
    description:
      "Analizo trendet mujore të inflacionit dhe grupeve COICOP për Kosovën.",
  },
};

export default function InflationTrackerPage() {
  const sourceLabel = cpiDataset.meta.source;
  const generatedAtLabel = formatGeneratedAt(cpiDataset.meta.generated_at);
  const coverageLabel = getDatasetCoverageLabel(cpiDataset.meta);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Gjurmuesi i inflacionit në Kosovë
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Vëzhgo indeksin e çmimeve të konsumatorit (2015 = 100) ose
            ndryshimet mujore të IHÇK-së për të kuptuar trendet kryesore të
            inflacionit.
          </p>
          <p className="text-xs text-muted-foreground">
            Burimi: {sourceLabel}. Gjeneruar më {generatedAtLabel}
            {coverageLabel ? ` · Periudha e të dhënave: ${coverageLabel}` : ""}.
          </p>
        </div>
        <InflationTracker />
      </section>
    </div>
  );
}
