import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import Page, { metadata } from "./page";

test("root page points visitors at the default locale", () => {
  const { container } = render(<Page />);

  // React hoists document metadata out of the component tree into <head>.
  const refresh = document.head.querySelector('meta[http-equiv="refresh"]');
  expect(refresh?.getAttribute("content")).toBe("0; url=/ja");
  expect(container.querySelector("a")?.getAttribute("href")).toBe("/ja");
});

test("root page canonicalises to the default locale homepage", () => {
  expect(metadata.alternates?.canonical).toBe("https://illumination-k.dev/ja");
  expect(metadata.alternates?.languages).toEqual({
    ja: "https://illumination-k.dev/ja",
    en: "https://illumination-k.dev/en",
    es: "https://illumination-k.dev/es",
    "x-default": "https://illumination-k.dev/ja",
  });
});
