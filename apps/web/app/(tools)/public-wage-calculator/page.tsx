import type { Metadata } from "next";

import { PublicWageCalculator } from "@workspace/public-wage-calculator";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";

export const metadata: Metadata = {
  title:
    "Kosovo Public Wage Calculator – Llogarit paga bruto sipas koeficientit",
  description:
    "Gjeni pagën bruto mujore për shërbyesit civilë duke përdorur koeficientin C, vlerën Z, përvojën dhe orët me shtesa sipas Ligjit për Pagat.",
  keywords: [
    "paga publike",
    "koeficientet",
    "ligji për pagat",
    "Kosovë",
    "kalkulator",
  ],
  alternates: {
    canonical: "/public-wage-calculator",
  },
  openGraph: {
    type: "article",
    url: "/public-wage-calculator",
    title:
      "Kosovo Public Wage Calculator – Llogarit paga bruto sipas koeficientit",
    description:
      "Transparencë për pagat publike në Kosovë me përllogaritje të bazës, përvojës dhe shtesave mujore.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Kosovo Public Wage Calculator – Llogarit paga bruto sipas koeficientit",
    description:
      "Përdorni koeficientët dhe vlerat Z për të llogaritur pagën mujore të sektorit publik në Kosovë.",
  },
};

export default function Page() {
  return (
    <ToolPage
      title="Llogaritësi i Pagave Publike"
      description="Llogarisni pagën bruto mujore sipas koeficientit C, vlerës Z dhe shtesave sipas Ligjit për Pagat në sektorin publik."
    >
      <PublicWageCalculator />
    </ToolPage>
  );
}
