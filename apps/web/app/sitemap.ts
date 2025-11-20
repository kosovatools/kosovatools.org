import type { MetadataRoute } from "next";
import { metadata } from "./layout";

export const dynamic = "force-static";

const staticRoutes = [
  "",
  "wage-calculator",
  "public-wage-calculator",
  "energy-flows",
  "prishtina-building-permits",
  "customs-codes",
  "about",
  "car-import-taxes",
  "data-insights",
  "drug-prices",
  "aviation-stats",
  "inflation-tracker",
  "economic-activity",
  "war-records",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? metadata.metadataBase?.toString();

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL or metadata.metadataBase.");
  }

  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  return staticRoutes.map((route) => {
    const path = route ? `/${route}` : "";

    return {
      url: `${normalizedBaseUrl}${path}`,
    };
  });
}
