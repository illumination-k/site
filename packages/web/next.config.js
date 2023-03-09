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
};

module.exports = withSuperjson()(nextConfig);
