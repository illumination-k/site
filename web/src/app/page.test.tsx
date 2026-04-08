import { redirect } from "next/navigation";

import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import Page from "./page";

test("root page redirects to default locale", () => {
  Page();
  expect(redirect).toHaveBeenCalledWith("/ja");
});
