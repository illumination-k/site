import { HomeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

import TwitterIcon from "@/icons/TwitterIcon";
import GithubIcon from "@/icons/GithubIcon";

import { css, cx } from "@/styled-system/css";
import { circle, grid, gridItem } from "@/styled-system/patterns";

export default function Nav({}) {
  return (
    <nav
      className={grid({ gap: "1", columns: 12, px: 4, bg: "black", py: 2, alignItems: "center" })}
    >
      <Link href={"/"} className={gridItem({ colStart: 1, colEnd: 5 })}>
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

      <div className={cx(gridItem({ colStart: 11, colEnd: 13, alignItems: "center", py: 1 }), grid({ columns: 3 }))}>
        <Link
          href={"/"}
          className={gridItem({ color: "white", fontSize: "xl", _hover: { color: "blue.500" } })}
        >
          Blog
        </Link>

        <a
          href="https://twitter.com/illuminationK"
          className={cx(gridItem({ rounded: "full" }), circle({ size: 8, bg: "white" }))}
          aria-label="twitter"
        >
          <TwitterIcon aria-hidden="true" className={css({ h: 8, w: 8 })} />
        </a>

        <a href="https://www.github.com/illumination-k" aria-label="github">
          <GithubIcon aria-hidden="true" className={gridItem({ h: 8, w: 8 })} fill="white" />
        </a>
      </div>
    </nav>
  );
}
