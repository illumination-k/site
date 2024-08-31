const path = require("path");

const redirectsData = require("./next.config.redirects");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["md-plugins"],
  async redirects() {
    return redirectsData;
  },
  output: "standalone",
  experimental: {
    // @link https://nextjs.org/docs/advanced-features/output-file-tracing#caveats
    outputFileTracingRoot: path.join(__dirname, "../"),

    // Experimental monorepo support
    // @link {https://github.com/vercel/next.js/pull/22867|Original PR}
    // @link {https://github.com/vercel/next.js/discussions/26420|Discussion}
    externalDir: true,
    typedRoutes: true,
  },
};

module.exports = nextConfig;
