import { apply, tw } from "@twind/core";
import { PropsWithChildren } from "react";

export type FooterBaseProps = {
  className?: string;
} & PropsWithChildren;

export default function FooterBase({ className, children }: FooterBaseProps) {
  return (
    <footer className={tw(apply("mt-auto", className))}>
      {children}
      <p className="bg-gray-300 font-bold text-sm text-center py-1">
        copyright © illumination-k 2020 - {(new Date()).getFullYear()}
      </p>
    </footer>
  );
}
