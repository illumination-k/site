import { HomeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

import TwitterIcon from "@/icons/TwitterIcon";
import GithubIcon from "@/icons/GithubIcon";

import { css } from "@/styled-system/css";
import { circle } from "@/styled-system/patterns";

export default function Nav({}) {
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
          className={css({
            fontSize: "3xl",
            color: "white",
            _hover: { color: "blue.500" },
            fontWeight: "black",
            hideBelow: "md",
          })}
        >
          illumination-k.dev
        </span>
        <HomeIcon aria-hidden="true" className={css({ h: 6, w: 6, hideFrom: "md", color: "white" })} />
      </Link>

      <div className={css({ display: "flex", gap: "3" })}>
        <Link
          href={"/"}
          className={css({ color: "white", fontSize: "xl", _hover: { color: "blue.500" } })}
        >
          Blog
        </Link>

        <a
          href="https://twitter.com/illuminationK"
          className={circle({ size: 8, bg: "white" })}
          aria-label="twitter"
        >
          <TwitterIcon aria-hidden="true" className={css({ h: 8, w: 8 })} />
        </a>

        <a href="https://www.github.com/illumination-k" aria-label="github">
          <GithubIcon aria-hidden="true" className={css({ h: 8, w: 8 })} fill="white" />
        </a>
      </div>
    </nav>
  );
}
