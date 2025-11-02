import type { NextConfig } from "next";

const buildTime = new Date()
  .toISOString()
  .split("T")
  .join(" ")
  .replace(/\.[0-9]+Z$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@workspace/ui", "@workspace/car-import-taxes"],
  env: {
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
};

export default nextConfig;
