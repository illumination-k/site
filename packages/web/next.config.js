const path = require("path");

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
};

module.exports = nextConfig;
