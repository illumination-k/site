import "./globals.css";

import { Inter, Noto_Sans_JP } from "next/font/google";

import { css, cx } from "@/styled-system/css";

import { GoogleAnalytics } from "@next/third-parties/google";

import FooterBase from "@/components/FooterBase";
import Nav from "@/components/Nav";

import AdsScripts from "./ads-scripts";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const GA_TRACKING_ID =
  process.env.NODE_ENV === "production" ? "G-5X44HTLX5D" : "G-mock";

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
        <header>
          <Nav />
        </header>
        <main className={css({ flex: 1 })}>{children}</main>
        <FooterBase />
        <AdsScripts />
        <GoogleAnalytics gaId={GA_TRACKING_ID} />
      </body>
    </html>
  );
}
