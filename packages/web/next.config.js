const path = require("path");
const { withSuperjson } = require("next-superjson");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    config.resolve.alias["@"] = path.join(__dirname, "src");
    return config;
  },
  transpilePackages: [
    "md-plugins",
    "@twind/core",
    "@twind/preset-autoprefix",
    "@twind/preset-tailwind",
    "@twind/with-next",
  ],
  i18n: {
    locales: ["ja", "en"],
    defaultLocale: "ja",
  },
  output: "standalone",
  experimental: {
    // @link https://nextjs.org/docs/advanced-features/output-file-tracing#caveats
    // outputFileTracingRoot: undefined, // ,path.join(__dirname, '../../'),
    outputFileTracingRoot: path.join(__dirname, "../../"),

    // Experimental monorepo support
    // @link {https://github.com/vercel/next.js/pull/22867|Original PR}
    // @link {https://github.com/vercel/next.js/discussions/26420|Discussion}
    externalDir: true,
  },
};

module.exports = withSuperjson()(nextConfig);
