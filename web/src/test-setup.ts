import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Caveat: () => ({ className: "mock-caveat" }),
  Noto_Sans_JP: () => ({ className: "mock-noto-sans-jp" }),
  Inter: () => ({ className: "mock-inter", variable: "--font-inter" }),
}));

// Vitest does not auto-clean React Testing Library renders between tests
// (unlike Jest with the default test environment). Without this, sequential
// `render(...)` calls leak DOM nodes from previous tests and cause duplicate
// query failures.
afterEach(() => {
  cleanup();
});
