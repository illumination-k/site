import "./globals.css";

import type { Metadata } from "next";

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
  return children;
}
