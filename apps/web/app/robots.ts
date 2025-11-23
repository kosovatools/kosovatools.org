import type { MetadataRoute } from "next";

import { metadata } from "./layout";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? metadata.metadataBase?.toString();

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL or metadata.metadataBase.");
  }

  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${normalizedBaseUrl}/sitemap.xml`,
  };
}
