import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const source = fs.readFileSync(path.resolve(__dirname, "layout.tsx"), "utf-8");

describe("LocaleLayout", () => {
  test("contains production GA tracking ID G-5X44HTLX5D", () => {
    expect(source).toContain("G-5X44HTLX5D");
    expect(source).toContain("GoogleAnalytics");
  });

  test("derives html lang from the route locale", () => {
    // A hardcoded lang makes every locale claim the same language, which also
    // collapses every page into a single Pagefind language index.
    expect(source).toContain("<html lang={locale}");
    expect(source).not.toMatch(/<html lang="[a-z]{2}"/);
  });
});
