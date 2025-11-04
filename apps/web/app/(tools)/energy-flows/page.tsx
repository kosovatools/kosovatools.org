import type { Metadata } from "next";
import dynamic from "next/dynamic";

import {
  ElectricityBalanceChart,
  EnergyFlowExplorerSkeleton,
} from "@workspace/energy-tracker";
import { electricityMonthly, energyMonthlySource } from "@workspace/stats";

const EnergyFlowExplorer = dynamic(
  () =>
    import("@workspace/energy-tracker").then((mod) => mod.EnergyFlowExplorer),
  {
    loading: () => <EnergyFlowExplorerSkeleton />,
  },
);

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
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">
            Importet kundrejt prodhimit vendas
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Krahaso importet mujore të energjisë elektrike me prodhimin vendor
            për të parë se si ndryshon varësia nga energjia e importuar në
            periudha të shkurtra ose të zgjatura.
          </p>
          <span className="text-xs text-muted-foreground">
            Burimi: {energyMonthlySource.table} ({energyMonthlySource.unit}).
          </span>
        </div>
        <ElectricityBalanceChart data={electricityMonthly} />
      </section>
      <EnergyFlowExplorer />
    </div>
  );
}
