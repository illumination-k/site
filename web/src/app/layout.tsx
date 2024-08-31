import "./globals.css";

import { Inter } from "next/font/google";

import FooterBase from "@/components/FooterBase";
import Nav from "@/components/Nav";

import AdsScripts from "./ads-scripts";

const inter = Inter({ subsets: ["latin"] });

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
      </body>
    </html>
  );
}
