import type { Metadata } from "next";

import { defaultLocale, locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/**
 * Entry page for the bare origin.
 *
 * `redirect()` cannot be used here: the site is a static export, so there is no
 * server to issue the 3xx. Next.js emits the redirect as a runtime error shell
 * — an `<html id="__next_error__">` document with no title, no description and
 * no content — that only resolves once React hydrates. Crawlers fetching
 * `https://illumination-k.dev/` see that empty shell, which is the worst
 * possible first impression for the origin most inbound links point at.
 *
 * Instead this renders a real document that says where the content lives:
 * a canonical pointing at the default locale, hreflang for every locale, and a
 * zero-delay meta refresh (plus a plain link) to move visitors along.
 */
const DEFAULT_LOCALE_PATH = `/${defaultLocale}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "illumination-k.dev",
  description: "Software Engineer / Bioinformatics",
  alternates: {
    // The origin is not a page in its own right — it is an alias of the default
    // locale homepage, so hand all of its signals to that URL.
    canonical: absoluteUrl(DEFAULT_LOCALE_PATH),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, absoluteUrl(`/${l}`)])),
      "x-default": absoluteUrl(DEFAULT_LOCALE_PATH),
    },
  },
};

export default function RootPage() {
  return (
    <>
      {/* React hoists this into <head>; browsers and crawlers both treat a
          zero-delay refresh as a redirect to the default locale. */}
      <meta httpEquiv="refresh" content={`0; url=${DEFAULT_LOCALE_PATH}`} />
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <a href={DEFAULT_LOCALE_PATH}>illumination-k.dev</a>
      </main>
    </>
  );
}
