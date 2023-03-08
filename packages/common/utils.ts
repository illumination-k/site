import { Lang } from ".";

export function formatDate(dt: Date): string {
  const y = dt.getFullYear();
  const m = ("00" + (dt.getMonth() + 1)).slice(-2);
  const d = ("00" + dt.getDate()).slice(-2);
  return (y + "-" + m + "-" + d);
}

export function getLangText(lang: Lang, texts: { [key in Lang]: string }): string {
  return texts[lang];
}
