import { Caveat } from "next/font/google";
import Link from "next/link";

import { css, cx } from "@/styled-system/css";
import { circle } from "@/styled-system/patterns";

import { HomeIcon } from "@heroicons/react/24/solid";
import type { Route } from "next";

import GithubIcon from "@/icons/GithubIcon";
import TwitterIcon from "@/icons/TwitterIcon";

import ThemeToggle from "./ThemeToggle";

const caveat = Caveat({ subsets: ["latin"] });

export default function Nav() {
  return (
    <nav
      className={css({
        bg: "bg.surface",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 4,
        py: 2,
        borderBottomWidth: 1,
        borderBottomColor: "border.default",
        position: "sticky",
        top: 0,
        zIndex: 50,
      })}
    >
      <Link href={"/"}>
        <span
          className={cx(
            css({
              fontSize: "3xl",
              color: "accent.primary",
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
          className={css({
            h: 6,
            w: 6,
            hideFrom: "md",
            color: "text.primary",
          })}
        />
      </Link>

      <div
        className={css({
          display: "flex",
          gap: 5,
          alignItems: "center",
        })}
      >
        <Link
          href={"/techblog/1" as Route}
          className={cx(
            css({
              color: "text.secondary",
              fontSize: "xl",
              transition: "colors",
              transitionDuration: "fast",
              _hover: { color: "accent.primary" },
            }),
            caveat.className,
          )}
        >
          TechBlog
        </Link>

        <a
          href="https://twitter.com/illuminationK"
          className={circle({ size: 8, bg: "bg.elevated" })}
          aria-label="twitter"
        >
          <TwitterIcon
            aria-hidden="true"
            className={css({ h: 8, w: 8, fill: "accent.primary" })}
          />
        </a>

        <a
          href="https://www.github.com/illumination-k"
          aria-label="github"
          className={css({
            color: "text.secondary",
            transition: "colors",
            transitionDuration: "fast",
            _hover: { color: "accent.primary" },
          })}
        >
          <GithubIcon aria-hidden="true" className={css({ h: 8, w: 8 })} />
        </a>

        <ThemeToggle />
      </div>
    </nav>
  );
}
