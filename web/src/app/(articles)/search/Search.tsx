"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { css } from "@/styled-system/css";

import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import type { Route } from "next";
import { z } from "zod";

import Loading from "@/components/Loading";

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

export default function Search() {
  const [loading, setLoading] = useState(false);
  const rawSearchParams = useSearchParams();
  const [results, setResults] = useState<PagefindResult[]>([]);

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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const search = await window.pagefind.search(q);

      const results = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          window.pagefind = await import(
            // @ts-expect-error @types of pagefind are not available
            // eslint-disable-next-line import/no-unresolved
            /* webpackIgnore: true */ "/pagefind/pagefind.js"
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
        gridTemplateColumns: "12",
        bg: "gray.50",
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
              bg: "gray.50",
              borderWidth: 1,
              borderColor: "gray.300",
              roundedLeft: "lg",
            })}
            value={query}
            placeholder="Search articles..."
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className={css({ bg: "blue.400", px: 2, roundedRight: "lg" })}
          >
            <MagnifyingGlassIcon
              className={css({ w: 6, h: 6, color: "white" })}
            />
          </button>
        </form>
        {loading && <Loading />}
        {results.map((result) => (
          <div
            key={result.url}
            className={css({
              p: 1,
              my: 2,
              bg: "white",
              borderWidth: 1,
              borderColor: "gray.600",
              rounded: "lg",
            })}
          >
            <h2
              className={css({
                fontSize: "xl",
                px: 3,
                _hover: { color: "blue.500" },
              })}
            >
              <Link href={result.url as Route}>
                {result.meta.title ?? "Untitled"}
              </Link>
            </h2>
            <div
              className={css({ bg: "blue.50", px: 5, rounded: "sm" })}
              dangerouslySetInnerHTML={{ __html: result.excerpt }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
