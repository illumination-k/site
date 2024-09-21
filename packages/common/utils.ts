import type { Lang } from ".";

export function formatDate(dt: Date): string {
  const y = dt.getFullYear();
  const m = `${dt.getMonth() + 1}`.padStart(2, "0");
  const d = `${dt.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getLangText(
  lang: Lang,
  texts: { [key in Lang]: string },
): string {
  return texts[lang];
}
