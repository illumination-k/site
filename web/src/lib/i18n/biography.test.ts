import { describe, expect, it } from "vitest";

import { locales } from "./config";
import { getDictionary } from "./getDictionary";

// The biography is a third-person "経歴書" blurb reused for talk/article
// submissions, so it has to stay short enough to paste into those forms:
// ~700 characters in Japanese, ~100 words in the latin-script locales.
const MAX_JA_CHARACTERS = 700;
const MAX_WORDS = 130;

// A blurb written for a third party must not slip into first person.
const FIRST_PERSON_PATTERNS: Record<string, RegExp> = {
  ja: /私|僕|俺|我々/,
  en: /\b(I|I'm|me|my|we|our)\b/i,
  es: /\b(yo|mi|mis|nosotros|nuestro|nuestra)\b/i,
};

describe("profile biography", () => {
  it.each(locales)("%s has a non-empty biography section", async (locale) => {
    const dict = await getDictionary(locale);
    expect(dict.profile.biography.length).toBeGreaterThan(0);
    expect(dict.profile.biographyParagraphs.length).toBeGreaterThan(0);
    for (const paragraph of dict.profile.biographyParagraphs) {
      expect(paragraph.trim()).not.toBe("");
    }
  });

  it("ja biography fits within 700 characters", async () => {
    const dict = await getDictionary("ja");
    const body = dict.profile.biographyParagraphs.join("");
    expect(body.length).toBeLessThanOrEqual(MAX_JA_CHARACTERS);
  });

  it.each(["en", "es"] as const)(
    "%s biography stays around 100 words",
    async (locale) => {
      const dict = await getDictionary(locale);
      const words = dict.profile.biographyParagraphs
        .join(" ")
        .split(/\s+/)
        .filter(Boolean);
      expect(words.length).toBeLessThanOrEqual(MAX_WORDS);
    },
  );

  it.each(locales)(
    "%s biography is written in third person",
    async (locale) => {
      const dict = await getDictionary(locale);
      const body = dict.profile.biographyParagraphs.join(" ");
      expect(body).not.toMatch(FIRST_PERSON_PATTERNS[locale]);
    },
  );
});
