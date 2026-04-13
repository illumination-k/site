import { Caveat } from "next/font/google";
import Link from "next/link";

import { css, cx } from "@/styled-system/css";

import { HomeIcon } from "@heroicons/react/24/solid";
import type { Route } from "next";

import GithubIcon from "@/icons/GithubIcon";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";

const caveat = Caveat({ subsets: ["latin"] });

export default async function Nav({ locale }: { locale: Locale }) {
  const dict = await getDictionary(locale);

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
      <Link href={`/${locale}` as Route}>
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
          href={`/${locale}/techblog/1` as Route}
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
          {dict.nav.techBlog}
        </Link>

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

        <LocaleSwitcher currentLocale={locale} />
        <ThemeToggle />
      </div>
    </nav>
  );
}
