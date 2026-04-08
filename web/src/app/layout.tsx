import "./globals.css";

import { Inter, Noto_Sans_JP } from "next/font/google";

import { css, cx } from "@/styled-system/css";

import type { Metadata } from "next";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const siteUrl = "https://www.illumination-k.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "illumination-k.dev",
    template: "%s | illumination-k.dev",
  },
  description: "Software Engineer / Bioinformatics",
  openGraph: {
    type: "website",
    siteName: "illumination-k.dev",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    creator: "@illuminationK",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
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
        {children}
      </body>
    </html>
  );
}
