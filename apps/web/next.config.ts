import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@workspace/ui", "@workspace/car-import-taxes"],
};

export default nextConfig;
