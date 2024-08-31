import "./globals.css";

import AdsScripts from "./ads-scripts";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";
import FooterBase from "@/components/FooterBase";

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
