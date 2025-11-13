import type { Metadata } from "next";

import { AviationDashboard } from "@workspace/aviation-stats";

export const metadata: Metadata = {
  title: "Statistikat e aviacionit – Pasagjerët dhe fluturimet mujore",
  description:
    "Analizo pasagjerët hyrës/dalës dhe numrin e fluturimeve që përpunon trafiku ajror i Kosovës sipas të dhënave mujore të ASK-së.",
  keywords: [
    "aviacioni kosovë",
    "trafiku ajror",
    "pasagjerët e aeroportit",
    "kosovo airport stats",
    "fluturimet kosovë",
  ],
  alternates: {
    canonical: "/aviation-stats",
  },
  openGraph: {
    type: "website",
    url: "/aviation-stats",
    title: "Statistikat e aviacionit – Pasagjerët dhe fluturimet mujore",
    description:
      "Vizualizime interaktive për hyrjet/daljet e pasagjerëve dhe frekuencën e fluturimeve të trafikut ajror në Kosovë.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Statistikat e aviacionit të Kosovës",
    description:
      "Monitoro trendet mujore të pasagjerëve hyrës, dalës dhe fluturimeve të trafikut ajror në Kosovë.",
  },
};

export default function AviationStatsPage() {
  return <AviationDashboard />;
}
