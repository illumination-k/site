import { PropsWithChildren } from "react";

import { Baskervville } from "next/font/google";
import Link from "next/link";

const font = Baskervville({ subsets: ["latin"], weight: "400" });

export type FooterBaseProps = {
  className?: string;
} & PropsWithChildren;

export default function FooterBase({ className, children }: FooterBaseProps) {
  return (
    <footer className={"mt-auto bg-gray-50"}>
      {children}
      <div
        className={`text-center md:(flex justify-center) font-bold text-sm py-1 ${font.className}`}
      >
        <p className="mx-2 italic">
          Copyright © illumination-k 2020 - {new Date().getFullYear()}
        </p>
        <Link
          className="text-blue-400 italic mx-2"
          href={"/"}
        >
          privacy policy
        </Link>
        <Link
          className="text-blue-400 italic mx-2"
          href={"/"}
        >
          disclaimer
        </Link>
      </div>
    </footer>
  );
}
