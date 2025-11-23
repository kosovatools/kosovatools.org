import type { Metadata } from "next";

import {
  WarRecordsOverview,
  buildWarRecordsDatasetSummary,
  crimeStats,
  WAR_RECORDS_TIMEFRAME_LABEL,
} from "@workspace/war-records";

import { WarRecordsExplorer } from "@workspace/war-records";
import ReactQueryProvider from "@/components/react-query-provider";
import { ToolPage } from "@workspace/ui/custom-components/tool-page";

const warRecordsTitle = `Kosovo War Records – Regjistrat e viktimave të krimeve të luftës (${WAR_RECORDS_TIMEFRAME_LABEL})`;
const warRecordsDescription = buildWarRecordsDatasetSummary(
  crimeStats.totals.records,
);
const warRecordsHeroDescription = `${warRecordsDescription} Një pasqyrë e humbjeve njerëzore e dokumentuar për të ruajtur kujtesën historike.`;

export const metadata: Metadata = {
  title: warRecordsTitle,
  description: warRecordsDescription,
  openGraph: {
    type: "article",
    url: "/war-records",
    title: warRecordsTitle,
    description: warRecordsDescription,
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  alternates: {
    canonical: "/war-records",
  },
  twitter: {
    card: "summary_large_image",
    title: warRecordsTitle,
    description: warRecordsDescription,
  },
  keywords: [
    "Kosovë",
    "krimet e luftës",
    "regjistrat",
    "lufta e Kosovës",
    "Humanitarian Law Center",
  ],
};

export default function Page() {
  return (
    <ToolPage
      title="Arkivi i Viktimave të Luftës"
      description={warRecordsHeroDescription}
    >
      <WarRecordsOverview />
      <ReactQueryProvider>
        <WarRecordsExplorer />
      </ReactQueryProvider>
    </ToolPage>
  );
}
