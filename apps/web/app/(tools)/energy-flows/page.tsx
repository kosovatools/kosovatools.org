import type { Metadata } from "next";
import {
  EnergyFlowExplorer,
  EnergyImportAndProduction,
} from "@workspace/energy-tracker";
import { loadDataset } from "@workspace/data";

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
import { ToolPage } from "@workspace/ui/custom-components/tool-page";

export default async function EnergyFlowsPage() {
  const electricityDataset = await loadDataset("kas.electricity");

  return (
    <ToolPage
      title="Gjurmuesi i rrjedhës së energjisë"
      description="Vëzhgo importet, eksportet dhe bilancin neto të energjisë elektrike të Kosovës me vendet fqinje duke përdorur të dhëna mujore nga ENTSO-E dhe ASK."
    >
      <EnergyImportAndProduction initialDataset={electricityDataset} />
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Flukset kufitare të energjisë
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Eksploro trendet mujore dhe modelet ditore të importeve/eksporteve
            për çdo fqinj të Kosovës duke përdorur të dhënat e agreguara nga
            ENTSO-E Transparency Platform.
          </p>
        </div>
        <EnergyFlowExplorer />
      </section>
    </ToolPage>
  );
}
