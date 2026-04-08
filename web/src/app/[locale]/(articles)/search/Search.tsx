"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { css } from "@/styled-system/css";

import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import type { Route } from "next";
import { z } from "zod";

import Loading from "@/components/Loading";
import { type Locale, isLocale } from "@/lib/i18n";

const searchParamsSchema = z.object({
  q: z.string().nullable(),
  category: z
    .string()
    .nullable()
    .transform((category) => category?.toLowerCase()),
});

const pagefindResultSchema = z.object({
  url: z.string().transform((url) => url.replace(".html", "").toLowerCase()),
  excerpt: z.string(),
  meta: z.object({
    title: z.string().optional(),
    image: z.string().optional(),
  }),
});

type PagefindResult = z.infer<typeof pagefindResultSchema>;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagefind: any;
  }
}

const placeholders: Record<Locale, string> = {
  ja: "記事を検索...",
  en: "Search articles...",
  es: "Buscar artículos...",
};

export default function Search({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(false);
  const rawSearchParams = useSearchParams();
  const [results, setResults] = useState<PagefindResult[]>([]);

  const validLocale: Locale = isLocale(locale) ? locale : "ja";

  const { q, category } = searchParamsSchema.parse({
    q: rawSearchParams.get("q"),
    category: rawSearchParams.get("category"),
  });

  const [query, setQuery] = useState(q ?? "");

  const handleSearch = useCallback(
    async ({ q, category }: { q: string; category?: string }) => {
      if (!window.pagefind) {
        return;
      }

      const search = await window.pagefind.search(q);

      const results = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        search.results.map((r: any) => r.data()),
      );

      setResults(
        z
          .array(pagefindResultSchema)
          .parse(results)
          .filter((r) => {
            if (category) {
              return r.url.toLowerCase().includes(category);
            }

            return true;
          }),
      );
    },
    [],
  );

  useEffect(() => {
    async function loadPagefind() {
      if (typeof window.pagefind === "undefined") {
        try {
          window.pagefind = await import(
            // @ts-expect-error @types of pagefind are not available

            /* webpackIgnore: true */ "/pagefind/pagefind.js" // eslint-disable-line import/no-unresolved
          );
        } catch (e) {
          console.error(e);
          window.pagefind = { search: () => ({ results: [] }) };
        }
      }
    }

    setLoading(true);
    loadPagefind()
      .then(async () => {
        if (q) {
          await handleSearch({ q, category });
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, [setLoading, handleSearch, q, category]);

  return (
    <div
      className={css({
        display: "grid",
        gap: 2,
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        bg: "bg.page",
      })}
    >
      <div className={css({ gridColumnStart: 3, gridColumnEnd: 11 })}>
        <form
          className={css({ my: 2, display: "flex" })}
          onSubmit={(e) => {
            e.preventDefault();
            const target = e.target as HTMLFormElement;
            const inputTarget = target[0] as HTMLInputElement;
            setLoading(true);
            handleSearch({
              q: inputTarget.value,
              category,
            })
              .then()
              .catch((e) => {
                console.error(e);
              })
              .finally(() => setLoading(false));
          }}
        >
          <input
            type="text"
            className={css({
              py: 1,
              px: 2,
              bg: "bg.input",
              borderWidth: 1,
              borderColor: "border.default",
              roundedLeft: "lg",
              color: "text.primary",
              _placeholder: { color: "text.tertiary" },
            })}
            value={query}
            placeholder={placeholders[validLocale]}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className={css({
              bg: "accent.primary",
              px: 2,
              roundedRight: "lg",
              color: "white",
            })}
          >
            <MagnifyingGlassIcon className={css({ w: 6, h: 6 })} />
          </button>
        </form>
        {loading && <Loading />}
        {results.map((result) => (
          <div
            key={result.url}
            className={css({
              p: 1,
              my: 2,
              bg: "bg.surface",
              borderWidth: 1,
              borderColor: "border.default",
              rounded: "lg",
            })}
          >
            <h2
              className={css({
                fontSize: "xl",
                px: 3,
                color: "text.primary",
                _hover: { color: "accent.primary" },
              })}
            >
              <Link href={result.url as Route}>
                {result.meta.title ?? "Untitled"}
              </Link>
            </h2>
            <div
              className={css({
                bg: "accent.muted",
                px: 5,
                rounded: "sm",
                color: "text.primary",
              })}
              dangerouslySetInnerHTML={{ __html: result.excerpt }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
