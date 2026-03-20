import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["md-plugins"],
  output: "export",
  typedRoutes: true,
};

module.exports = nextConfig;
