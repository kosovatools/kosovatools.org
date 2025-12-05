import type { Metadata } from "next";

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

import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import { AviationStats } from "@workspace/aviation-stats";
import { loadDataset } from "@workspace/data";

export default async function AviationStatsPage() {
  const airTransport = await loadDataset("kas.air-transport");

  return (
    <ToolPage
      title="Statistikat e aviacionit të Kosovës"
      description="Pasqyro pasagjerët hyrës dhe dalës që qarkullojnë çdo muaj në Aeroportin Ndërkombëtar të Prishtinës duke përdorur të dhënat zyrtare të ASK-së për trafikun ajror."
    >
      <AviationStats initialDataset={airTransport} />
    </ToolPage>
  );
}
