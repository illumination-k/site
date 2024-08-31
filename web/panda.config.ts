import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,
  jsxFramework: "react",

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  utilities: {
    extend: {},
  },

  // Useful for theme customization
  theme: {
    extend: {
      textStyles: {},
    },
  },

  // The output directory for your css system
  outdir: "./src/styled-system",
});
