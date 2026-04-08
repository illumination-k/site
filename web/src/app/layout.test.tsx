import React from "react";

import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import RootLayout from "./layout";

describe("RootLayout", () => {
  test("renders children", () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="child">test</div>
      </RootLayout>,
    );

    expect(container.querySelector("[data-testid='child']")).toBeTruthy();
  });

  test("locale layout contains production GA tracking ID G-5X44HTLX5D", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const layoutPath = path.resolve(__dirname, "[locale]/layout.tsx");
    const source = fs.readFileSync(layoutPath, "utf-8");

    expect(source).toContain("G-5X44HTLX5D");
    expect(source).toContain("GoogleAnalytics");
  });
});
