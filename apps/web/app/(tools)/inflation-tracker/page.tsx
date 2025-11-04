import type { Metadata } from "next";

import { InflationDashboard } from "@workspace/inflation-tracker";

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
  return <InflationDashboard />;
}
