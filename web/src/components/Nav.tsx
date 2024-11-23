import { Caveat } from "next/font/google";
import Link from "next/link";

import { css, cx } from "@/styled-system/css";
import { circle } from "@/styled-system/patterns";

import { HomeIcon } from "@heroicons/react/24/solid";
import type { Route } from "next";

import GithubIcon from "@/icons/GithubIcon";
import TwitterIcon from "@/icons/TwitterIcon";

const caveat = Caveat({ subsets: ["latin"] });

export default function Nav() {
  return (
    <nav
      className={css({
        bg: "black",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 4,
        py: 2,
      })}
    >
      <Link href={"/"}>
        <span
          className={cx(
            css({
              fontSize: "3xl",
              color: "white",
              fontWeight: "black",
              hideBelow: "md",
            }),
            caveat.className,
          )}
        >
          illumination-k.dev
        </span>
        <HomeIcon
          aria-hidden="true"
          className={css({ h: 6, w: 6, hideFrom: "md", color: "white" })}
        />
      </Link>

      <div className={css({ display: "flex", gap: 5 })}>
        <Link
          href={"/techblog/1" as Route}
          className={cx(
            css({ color: "white", fontSize: "xl" }),
            caveat.className,
          )}
        >
          TechBlog
        </Link>

        <a
          href="https://twitter.com/illuminationK"
          className={circle({ size: 8, bg: "white" })}
          aria-label="twitter"
        >
          <TwitterIcon
            aria-hidden="true"
            className={css({ h: 8, w: 8, fill: "blue.400" })}
          />
        </a>

        <a href="https://www.github.com/illumination-k" aria-label="github">
          <GithubIcon
            aria-hidden="true"
            className={css({ h: 8, w: 8 })}
            fill="white"
          />
        </a>
      </div>
    </nav>
  );
}
