"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { css } from "@/styled-system/css";

import { GlobeAltIcon } from "@heroicons/react/24/outline";
import type { Route } from "next";

import { type Locale, localeLabels, locales } from "@/lib/i18n";

function getPathnameWithLocale(pathname: string, newLocale: Locale): string {
  const segments = pathname.split("/");
  // segments[0] is "", segments[1] is locale
  segments[1] = newLocale;
  return segments.join("/");
}

export default function LocaleSwitcher({
  currentLocale,
}: {
  currentLocale: Locale;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <div className={css({ position: "relative" })}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Switch language"
        className={css({
          color: "text.secondary",
          transition: "colors",
          transitionDuration: "fast",
          _hover: { color: "accent.primary" },
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontSize: "sm",
        })}
      >
        <GlobeAltIcon className={css({ h: 5, w: 5 })} />
        <span className={css({ hideBelow: "md", fontWeight: "medium" })}>
          {currentLocale.toUpperCase()}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={css({
              position: "fixed",
              inset: 0,
              zIndex: 40,
              cursor: "default",
            })}
            aria-label="Close language menu"
          />
          <div
            className={css({
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              bg: "bg.surface",
              borderWidth: 1,
              borderColor: "border.default",
              rounded: "lg",
              shadow: "0 4px 12px rgba(0,0,0,0.1)",
              py: 1,
              zIndex: 50,
              minW: "120px",
            })}
          >
            {locales.map((locale) => (
              <Link
                key={locale}
                href={getPathnameWithLocale(pathname, locale) as Route}
                onClick={() => setOpen(false)}
                className={css({
                  display: "block",
                  px: 4,
                  py: 2,
                  fontSize: "sm",
                  color:
                    locale === currentLocale
                      ? "accent.primary"
                      : "text.secondary",
                  fontWeight: locale === currentLocale ? "bold" : "normal",
                  _hover: { bg: "bg.elevated", color: "accent.primary" },
                  transition: "colors",
                  transitionDuration: "fast",
                  whiteSpace: "nowrap",
                })}
              >
                {localeLabels[locale]}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
