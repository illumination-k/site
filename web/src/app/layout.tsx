import "./globals.css";

import AdsScripts from "./ads-scripts";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Nav />
        {children}
        <AdsScripts />
      </body>
    </html>
  );
}
