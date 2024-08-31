import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { ChevronUpIcon } from "@heroicons/react/24/outline";
import { Headings, PostMeta } from "common";
import Link from "next/link";

import { css, cx } from "@/styled-system/css";
import { Route } from "next";

type Props = {
  className?: string;
  meta: PostMeta;
  headings: Headings;
};

const iconClassName = css({ h: 4, w: 4 });

export default function Toc({ className, headings, meta }: Props) {
  const heading = meta.lang === "ja" ? "目次" : "Contents";
  return (
    <article className={className}>
      <h1 className={css({ fontSize: "lg", fontWeight: "black", pb: 2 })}>
        <p>{heading}</p>
      </h1>
      <ul className="list-none">
        {headings.map(({ value, depth }, i) => (
          <li className={css({ mt: 2 })} key={i}>
            <Link
              className={css({
                display: "flex",
                alignItems: "center",
                wordBreak: "break-word",
                _hover: { color: "blue.500" },
              })}
              // "hover:text-blue-400 focus:text-blue-500 focus:underline flex items-center break-words",
              // depth === 3 ? "px-4 text-gray-800" : "px-2 font-medium"}
              href={`/techblog/post/${meta.uuid}#${i}`}
            >
              {depth === 3 ? <ChevronRightIcon aria-hidden="true" className={iconClassName} /> : null}
              {value}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/techblog/post/${meta.uuid}` as Route}
        className={css({ display: "flex", gap: 2, alignItems: "center", pt: 4, _hover: { color: "blue.500" } })}
        // "flex gap-2 items-center text-lg font-bold pt-4 hover:text-blue-400"
      >
        <ChevronUpIcon className={iconClassName} />
        Page Top
      </Link>
    </article>
  );
}
