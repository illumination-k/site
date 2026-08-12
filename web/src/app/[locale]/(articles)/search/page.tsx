import React, { Suspense } from "react";

import type { Metadata } from "next";

import Loading from "@/components/Loading";
import { type Locale, getDictionary, isLocale } from "@/lib/i18n";

import Search from "./Search";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const dict = await getDictionary(locale);

  // The results are rendered client-side by Pagefind, so there is nothing here
  // worth indexing. `noindex` (rather than a robots.txt Disallow) is what
  // actually keeps the URL out of the index: a disallowed page can still be
  // indexed URL-only, because the crawler never gets to read this directive.
  return {
    title: dict.meta.search,
    description: dict.meta.searchDescription,
    robots: { index: false, follow: true },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <Search locale={locale} />
    </Suspense>
  );
}
