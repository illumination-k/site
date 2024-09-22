"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { css } from "@/styled-system/css";

import type { Route } from "next";
import { z } from "zod";

const pagefindResultSchema = z.object({
  url: z.string().transform((url) => url.replace(".html", "")),
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindResult[]>([]);

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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadPagefind();
  }, []);

  async function handleSearch() {
    if (!window.pagefind) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const search = await window.pagefind.search(query);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    const results = await Promise.all(search.results.map((r: any) => r.data()));

    setResults(z.array(pagefindResultSchema).parse(results));
  }

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
          onSubmit={(e) => {
            e.preventDefault();
            // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises
            handleSearch();
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
              rounded: "lg",
            })}
            value={query}
            placeholder="Search articles..."
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

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
