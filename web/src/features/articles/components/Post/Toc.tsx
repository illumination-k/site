import Link from "next/link";

import { css } from "@/styled-system/css";

import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { ChevronUpIcon } from "@heroicons/react/24/outline";
import type { Headings, PostMeta } from "common";
import type { Route } from "next";

interface Props {
  className?: string;
  meta: PostMeta;
  headings: Headings;
  prefix: string;
}

const iconClassName = css({ h: 4, w: 4 });

export default function Toc({ className, headings, meta, prefix }: Props) {
  const heading = meta.lang === "ja" ? "目次" : "Contents";
  return (
    <article className={className}>
      <h1
        className={css({
          fontSize: "lg",
          fontWeight: "black",
          pb: 2,
          color: "text.primary",
        })}
      >
        <p>{heading}</p>
      </h1>
      <ul>
        {headings.map(({ value, depth }, i) => (
          <li className={css({ mt: 2 })} key={i}>
            <Link
              className={css({
                display: "flex",
                alignItems: "center",
                wordBreak: "break-word",
                color: depth === 3 ? "text.tertiary" : "text.secondary",
                transition: "colors",
                transitionDuration: "fast",
                _hover: { color: "accent.primary" },
              })}
              href={`/${prefix}/post/${meta.uuid}#${i}` as Route}
            >
              {depth === 3 ? (
                <ChevronRightIcon
                  aria-hidden="true"
                  className={iconClassName}
                />
              ) : null}
              {value}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/${prefix}/post/${meta.uuid}` as Route}
        className={css({
          display: "flex",
          gap: 2,
          alignItems: "center",
          pt: 4,
          color: "text.secondary",
          transition: "colors",
          transitionDuration: "fast",
          _hover: { color: "accent.primary" },
        })}
      >
        <ChevronUpIcon className={iconClassName} />
        Page Top
      </Link>
    </article>
  );
}
