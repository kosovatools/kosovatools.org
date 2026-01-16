import type { Metadata } from "next";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";
import { RecountDiffExplorer } from "./recount-diff-explorer";

export const metadata: Metadata = {
  title:
    "Rinumërimi i votave 2025 – Diferencat mes numërimit fillestar dhe rinumërimit",
  description:
    "Eksploro ndryshimet në vota mes numërimit fillestar dhe rinumërimit në Kosovë sipas të dhënave të KQZ-së.",
  keywords: [
    "rinumërimi i votave",
    "kqz kosovë",
    "diferencat e votave",
    "numërimi fillestar",
    "zgjedhjet parlamentare",
    "zgjedhjet 2025",
  ],
  alternates: {
    canonical: "/rinumrimi-votave",
  },
  openGraph: {
    type: "article",
    url: "/rinumrimi-votave",
    title:
      "Rinumërimi i votave 2025 – Diferencat mes numërimit fillestar dhe rinumërimit",
    description:
      "Vizualizo ndryshimet e rinumërimit për vendvotimet e rishikuara nga KQZ.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Rinumërimi i votave 2025 – Diferencat mes numërimit fillestar dhe rinumërimit",
    description:
      "Shfleto diferencat e votave për vendvotimet e rinumëruara në Kosovë.",
  },
};

export default async function RecountDiffPage() {
  return (
    <ToolPage
      title="Rinumërimi i votave 2025"
      description="Krahaso diferencat në vota mes numërimit fillestar dhe rinumërimit vetëm për vendvotimet që u rishikuan nga KQZ."
      footer="Burimi: Komisioni Qendror i Zgjedhjeve (KQZ). Ky eksplorues paraqet vetëm diferencat për vendvotimet e rinumëruara."
      className="space-y-6"
    >
      <RecountDiffExplorer />
    </ToolPage>
  );
}
