import type { Metadata } from "next";

import { EnergyFlowExplorer } from "@workspace/energy-tracker";

export const metadata: Metadata = {
  title: "Gjurmuesi i rrjedhës së energjisë – Flukset kufitare të Kosovës",
  description:
    "Vëzhgo importet, eksportet dhe bilancin neto të energjisë elektrike të Kosovës me vendet fqinje duke përdorur të dhëna mujore nga ENTSO-E.",
  keywords: [
    "energjia kosovë",
    "entsoe kosovo",
    "importi i energjisë",
    "eksporti i energjisë",
    "rrjedhat e energjisë kosovë",
  ],
  alternates: {
    canonical: "/energy-flows",
  },
  openGraph: {
    type: "website",
    url: "/energy-flows",
    title: "Gjurmuesi i rrjedhës së energjisë – Flukset kufitare të Kosovës",
    description:
      "Analizo flukset kufitare të energjisë elektrike dhe bilancin neto të Kosovës sipas të dhënave mujore të ENTSO-E.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gjurmuesi i rrjedhës së energjisë – Flukset kufitare të Kosovës",
    description:
      "Monitoro importet dhe eksportet mujore të energjisë elektrike të Kosovës për secilin fqinj.",
  },
};

export default function EnergyFlowsPage() {
  return <EnergyFlowExplorer />;
}
