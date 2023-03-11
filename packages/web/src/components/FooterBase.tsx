import { apply, tw } from "@twind/core";
import { PropsWithChildren } from "react";

import { Baskervville } from "next/font/google";

const font = Baskervville({ subsets: ["latin"], weight: "400" });

export type FooterBaseProps = {
  className?: string;
} & PropsWithChildren;

export default function FooterBase({ className, children }: FooterBaseProps) {
  return (
    <footer className={tw(apply("mt-auto", className))}>
      {children}
      <p className={`bg-gray-50 font-bold text-sm text-center py-1 ${font.className}`}>
        <i>copyright © illumination-k 2020 - {(new Date()).getFullYear()}</i>
      </p>
    </footer>
  );
}
