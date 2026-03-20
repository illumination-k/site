import { Baskervville } from "next/font/google";
import Link from "next/link";
import type { PropsWithChildren } from "react";

import { css, cx } from "@/styled-system/css";

const font = Baskervville({ subsets: ["latin"], weight: "400" });

export type FooterBaseProps = {
  className?: string;
} & PropsWithChildren;

export default function FooterBase({ children }: FooterBaseProps) {
  return (
    <footer
      className={css({
        mt: "auto",
        bg: "bg.surface",
        borderTopWidth: 1,
        borderTopColor: "border.default",
        py: 6,
      })}
    >
      {children}
      <div
        className={cx(
          css({
            display: "flex",
            gap: 5,
            md: {
              display: "flex",
              justifyContent: "center",
            },
            fontWeight: "extrabold",
            fontSize: "md",
            color: "text.secondary",
          }),
          font.className,
        )}
      >
        <p className={css({ fontStyle: "italic" })}>
          Copyright © illumination-k 2020 - {new Date().getFullYear()}
        </p>
        <Link
          className={css({
            color: "accent.primary",
            fontStyle: "italic",
            _hover: { color: "accent.hover" },
          })}
          href={"/privacy-policy"}
        >
          privacy policy
        </Link>
        <Link
          className={css({
            color: "accent.primary",
            fontStyle: "italic",
            _hover: { color: "accent.hover" },
          })}
          href={"/disclaimer"}
        >
          disclaimer
        </Link>
      </div>
    </footer>
  );
}
