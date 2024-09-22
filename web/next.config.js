/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["md-plugins"],
  output: "export",
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
