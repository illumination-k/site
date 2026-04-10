import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  isLocale,
  localeToLang,
  locales,
  localeToOgLocale,
} from "./config";
import { getDictionary } from "./getDictionary";

describe("i18n/config", () => {
  it("locales contains ja, en, es", () => {
    expect(locales).toEqual(["ja", "en", "es"]);
  });

  it("defaultLocale is ja", () => {
    expect(defaultLocale).toBe("ja");
  });

  describe("isLocale", () => {
    it("returns true for supported locales", () => {
      expect(isLocale("ja")).toBe(true);
      expect(isLocale("en")).toBe(true);
      expect(isLocale("es")).toBe(true);
    });

    it("returns false for unsupported values", () => {
      expect(isLocale("fr")).toBe(false);
      expect(isLocale("")).toBe(false);
    });
  });

  describe("localeToLang", () => {
    it.each([
      ["ja", "ja"],
      ["en", "en"],
      ["es", "es"],
    ] as const)("maps %s -> %s", (loc, lang) => {
      expect(localeToLang(loc)).toBe(lang);
    });
  });

  it("localeToOgLocale covers every locale", () => {
    for (const loc of locales) {
      expect(localeToOgLocale[loc]).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
  });
});

describe("getDictionary", () => {
  it("loads the ja dictionary", async () => {
    const dict = await getDictionary("ja");
    expect(dict).toBeDefined();
    expect(typeof dict).toBe("object");
  });

  it("loads the en dictionary", async () => {
    const dict = await getDictionary("en");
    expect(dict).toBeDefined();
    expect(typeof dict).toBe("object");
  });

  it("loads the es dictionary", async () => {
    const dict = await getDictionary("es");
    expect(dict).toBeDefined();
    expect(typeof dict).toBe("object");
  });

  it("returns distinct objects for distinct locales", async () => {
    const [ja, en] = await Promise.all([
      getDictionary("ja"),
      getDictionary("en"),
    ]);
    // They should be the same shape but not the same reference content-wise.
    expect(ja).not.toBe(en);
  });
});
