import { apply, tw } from "@twind/core";
import { PropsWithChildren } from "react";

import { Baskervville } from "next/font/google";
import Link from "next/link";
import { pagesPath } from "@/lib/$path";

const font = Baskervville({ subsets: ["latin"], weight: "400" });

export type FooterBaseProps = {
  className?: string;
} & PropsWithChildren;

export default function FooterBase({ className, children }: FooterBaseProps) {
  return (
    <footer className={tw(apply("mt-auto bg-gray-50", className))}>
      {children}
      <div
        className={`text-center md:(flex justify-center) font-bold text-sm py-1 ${font.className}`}
      >
        <p className="mx-2 italic">Copyright © illumination-k 2020 - {(new Date()).getFullYear()}</p>
        <Link className="text-blue-400 italic mx-2" href={pagesPath.privacypolicy.$url()}>privacy policy</Link>
        <Link className="text-blue-400 italic mx-2" href={pagesPath.terms_service.$url()}>disclaimer</Link>
      </div>
    </footer>
  );
}
