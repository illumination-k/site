import { describe, expect, it } from "vitest";
import { formatDate, getLangText } from "./utils";

describe("formatDate", () => {
  it("formats a date with zero-padded month and day", () => {
    expect(formatDate(new Date("2024-01-05"))).toBe("2024-01-05");
  });

  it("formats a date with double-digit month and day", () => {
    expect(formatDate(new Date("2024-12-25"))).toBe("2024-12-25");
  });

  it("pads single-digit months", () => {
    expect(formatDate(new Date("2023-03-01"))).toBe("2023-03-01");
  });

  it("pads single-digit days", () => {
    expect(formatDate(new Date("2023-10-07"))).toBe("2023-10-07");
  });
});

describe("getLangText", () => {
  const texts = { ja: "Japanese text", en: "English text" };

  it("returns Japanese text for ja lang", () => {
    expect(getLangText("ja", texts)).toBe("Japanese text");
  });

  it("returns English text for en lang", () => {
    expect(getLangText("en", texts)).toBe("English text");
  });
});
