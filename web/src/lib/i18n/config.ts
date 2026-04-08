export const locales = ["ja", "en", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ja";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const localeLabels: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  es: "Español",
};

export const localeToOgLocale: Record<Locale, string> = {
  ja: "ja_JP",
  en: "en_US",
  es: "es_ES",
};
