import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: isCI ? "http://localhost:8788" : "http://localhost:3000",
  },
  webServer: {
    command: isCI ? "npx serve out -l 8788" : "pnpm dev:next",
    url: isCI ? "http://localhost:8788" : "http://localhost:3000",
    reuseExistingServer: true,
  },
});
