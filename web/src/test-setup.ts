import { vi } from "vitest";

vi.mock("next/font/google", () => ({
  Caveat: () => ({ className: "mock-caveat" }),
  Noto_Sans_JP: () => ({ className: "mock-noto-sans-jp" }),
  Inter: () => ({ className: "mock-inter", variable: "--font-inter" }),
}));
