import "./globals.css";

import { Inter } from "next/font/google";

import { GoogleAnalytics } from "@next/third-parties/google";

import FooterBase from "@/components/FooterBase";
import Nav from "@/components/Nav";

import AdsScripts from "./ads-scripts";

const inter = Inter({ subsets: ["latin"] });

const GA_TRACKING_ID =
  process.env.NODE_ENV === "production" ? "G-5X44HTLX5D" : "G-mock";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <header>
          <Nav />
        </header>
        <main>{children}</main>
        <FooterBase />
        <AdsScripts />
        <GoogleAnalytics gaId={GA_TRACKING_ID} />
      </body>
    </html>
  );
}
