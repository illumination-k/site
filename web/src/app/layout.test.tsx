import React from "react";

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGoogleAnalytics = vi.fn(() => null);

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: (props: { gaId: string }) => {
    mockGoogleAnalytics(props);
    return <script data-testid="google-analytics" data-ga-id={props.gaId} />;
  },
}));

vi.mock("@/components/Nav", () => ({
  default: () => <nav>Nav</nav>,
}));

vi.mock("@/components/FooterBase", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("./ads-scripts", () => ({
  default: () => null,
}));

// RootLayout renders <html> which is not valid inside a test container,
// so we extract the body rendering logic by importing and calling directly.
import RootLayout from "./layout";

describe("Google Analytics tag", () => {
  beforeEach(() => {
    mockGoogleAnalytics.mockClear();
  });

  test("GoogleAnalytics component is rendered with a valid GA tracking ID", () => {
    // RootLayout renders <html><body>...</body></html>
    // render() will strip <html>/<body> but child elements remain
    render(
      <RootLayout>
        <div>test</div>
      </RootLayout>,
    );

    expect(mockGoogleAnalytics).toHaveBeenCalled();
    const props = mockGoogleAnalytics.mock.calls[0][0] as { gaId: string };
    expect(props.gaId).toBeDefined();
    expect(props.gaId).not.toBe("");
  });

  test("GA tracking ID starts with G- prefix", () => {
    render(
      <RootLayout>
        <div>test</div>
      </RootLayout>,
    );

    const props = mockGoogleAnalytics.mock.calls[0][0] as { gaId: string };
    expect(props.gaId).toMatch(/^G-.+$/);
  });

  test("layout.tsx contains production GA tracking ID G-5X44HTLX5D", async () => {
    // Verify the source code has the correct production GA ID
    // This ensures the real tracking ID is never accidentally removed
    const fs = await import("node:fs");
    const path = await import("node:path");
    const layoutPath = path.resolve(__dirname, "layout.tsx");
    const source = fs.readFileSync(layoutPath, "utf-8");

    expect(source).toContain("G-5X44HTLX5D");
    expect(source).toContain("GoogleAnalytics");
  });
});
