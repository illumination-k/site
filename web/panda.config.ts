import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,
  jsxFramework: "react",

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  conditions: {
    extend: {
      dark: "[data-color-mode=dark] &",
      light: "[data-color-mode=light] &",
    },
  },

  utilities: {
    extend: {},
  },

  // Useful for theme customization
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      textStyles: {},
      semanticTokens: {
        colors: {
          bg: {
            page: { value: { base: "#f8fafc", _dark: "#0f172a" } },
            surface: { value: { base: "#ffffff", _dark: "#1e293b" } },
            elevated: { value: { base: "#f1f5f9", _dark: "#273548" } },
            input: { value: { base: "#ffffff", _dark: "#1a2332" } },
          },
          border: {
            default: { value: { base: "#e2e8f0", _dark: "#334155" } },
            subtle: { value: { base: "#f1f5f9", _dark: "#1e293b" } },
          },
          text: {
            primary: { value: { base: "#0f172a", _dark: "#e2e8f0" } },
            secondary: { value: { base: "#475569", _dark: "#94a3b8" } },
            tertiary: { value: { base: "#94a3b8", _dark: "#64748b" } },
          },
          accent: {
            primary: { value: { base: "#0ea5e9", _dark: "#38bdf8" } },
            hover: { value: { base: "#0284c7", _dark: "#7dd3fc" } },
            muted: { value: { base: "#e0f2fe", _dark: "#0c4a6e" } },
          },
          tag: {
            bg: { value: { base: "#dbeafe", _dark: "#1e3a5f" } },
            text: { value: { base: "#1e40af", _dark: "#7dd3fc" } },
            hoverText: { value: { base: "#ffffff", _dark: "#0f172a" } },
          },
          code: {
            inlineBg: { value: { base: "#f1f5f9", _dark: "#1e293b" } },
            inlineText: { value: { base: "#be185d", _dark: "#f472b6" } },
            blockBg: { value: { base: "#f8fafc", _dark: "#0d1117" } },
          },
          table: {
            headerBg: { value: { base: "#cbd5e1", _dark: "#273548" } },
          },
          warning: {
            bg: { value: { base: "#fef3c7", _dark: "#422006" } },
            text: { value: { base: "#92400e", _dark: "#fbbf24" } },
          },
          draft: {
            bg: { value: { base: "#f3f4f6", _dark: "#1c1917" } },
            text: { value: { base: "#4b5563", _dark: "#a8a29e" } },
          },
          aiGenerated: {
            bg: { value: { base: "#ede9fe", _dark: "#1e1b4b" } },
            text: { value: { base: "#5b21b6", _dark: "#a78bfa" } },
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "./src/styled-system",
});
