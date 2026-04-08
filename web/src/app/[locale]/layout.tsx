import { Inter, Noto_Sans_JP } from "next/font/google";
import { notFound } from "next/navigation";

import { css, cx } from "@/styled-system/css";

import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";

import FooterBase from "@/components/FooterBase";
import Nav from "@/components/Nav";
import { getDictionary, isLocale, localeToOgLocale, locales } from "@/lib/i18n";

import AdsScripts from "../ads-scripts";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const GA_TRACKING_ID =
  process.env.NODE_ENV === "production" ? "G-5X44HTLX5D" : "G-mock";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);
  return {
    description: dict.meta.siteDescription,
    openGraph: {
      locale: localeToOgLocale[locale],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem("color-mode");if(m==="light"||m==="dark"){document.documentElement.setAttribute("data-color-mode",m)}else if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.setAttribute("data-color-mode","dark")}else{document.documentElement.setAttribute("data-color-mode","light")}}catch(e){document.documentElement.setAttribute("data-color-mode","light")}})()`,
          }}
        />
      </head>
      <body
        className={cx(
          notoSansJP.className,
          inter.variable,
          css({
            bg: "bg.page",
            color: "text.primary",
            minH: "100vh",
            display: "flex",
            flexDirection: "column",
          }),
        )}
      >
        <header>
          <Nav locale={locale} />
        </header>
        <main className={css({ flex: 1 })}>{children}</main>
        <FooterBase locale={locale} />
        <AdsScripts />
        <GoogleAnalytics gaId={GA_TRACKING_ID} />
      </body>
    </html>
  );
}
