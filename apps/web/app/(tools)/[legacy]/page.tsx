import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RedirectPage } from "@/components/redirect-page";
import { legacyRedirects } from "./redirects";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(legacyRedirects).map((legacy) => ({ legacy }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[legacy]">): Promise<Metadata> {
  const destination = legacyRedirects[(await params).legacy];

  if (!destination) {
    return {};
  }

  return {
    title: "Duke ridrejtuar…",
    description: `Kjo faqe është zhvendosur te ${destination}.`,
    robots: { index: false, follow: true },
    alternates: { canonical: destination },
  };
}

export default async function LegacyRedirectPage({
  params,
}: PageProps<"/[legacy]">) {
  const destination = legacyRedirects[(await params).legacy];

  if (!destination) {
    notFound();
  }

  return <RedirectPage to={destination} />;
}
