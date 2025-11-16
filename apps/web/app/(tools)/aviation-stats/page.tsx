import type { Metadata } from "next";

import {
  airTransportMonthly,
  formatGeneratedAt,
  getDatasetCoverageLabel,
} from "@workspace/kas-data";

import { AviationStatsChart } from "@workspace/aviation-stats";

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
  const airTransportMeta = airTransportMonthly.meta;
  const sourceLabel = airTransportMeta.source;
  const generatedAtLabel = formatGeneratedAt(airTransportMeta.generated_at);
  const coverageLabel = getDatasetCoverageLabel(airTransportMeta);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Statistikat e aviacionit të Kosovës
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Pasqyro pasagjerët hyrës dhe dalës që qarkullojnë çdo muaj në
            Aeroportin Ndërkombëtar të Prishtinës duke përdorur të dhënat
            zyrtare të ASK-së për trafikun ajror.
          </p>
          <p className="text-xs text-muted-foreground">
            Burimi: {sourceLabel}. Gjeneruar më {generatedAtLabel}
            {coverageLabel ? ` · Periudha e të dhënave: ${coverageLabel}` : ""}.
          </p>
        </div>
        <AviationStatsChart />
      </section>
    </div>
  );
}
