import withBundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@workspace/ui", "@workspace/car-import-taxes"],
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
