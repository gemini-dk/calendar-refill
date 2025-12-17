import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["pdfkit"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
