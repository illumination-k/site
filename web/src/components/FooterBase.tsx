import { PropsWithChildren } from "react";

import { Baskervville } from "next/font/google";
import Link from "next/link";
import { css, cx } from "@/styled-system/css";

const font = Baskervville({ subsets: ["latin"], weight: "400" });

export type FooterBaseProps = {
  className?: string;
} & PropsWithChildren;

export default function FooterBase({ children }: FooterBaseProps) {
  return (
    <footer className={css({ mt: "auto", bg: "gray.50" })}>
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
          }),
          font.className,
          font.className,
        )}
      >
        <p className={css({ fontStyle: "italic" })}>
          Copyright © illumination-k 2020 - {new Date().getFullYear()}
        </p>
        <Link
          className={css({ color: "blue.400", fontStyle: "italic" })}
          href={"/privacy-policy"}
        >
          privacy policy
        </Link>
        <Link
          className={css({ color: "blue.400", fontStyle: "italic" })}
          href={"/disclaimer"}
        >
          disclaimer
        </Link>
      </div>
    </footer>
  );
}
