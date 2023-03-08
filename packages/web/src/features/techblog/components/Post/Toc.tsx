import { pagesPath } from "@/lib/$path";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { apply, tw } from "@twind/core";
import { Headings, PostMeta } from "common";
import Link from "next/link";

type Props = {
  className?: string;
  meta: PostMeta;
  headings: Headings;
};

export default function Toc({ className, headings, meta }: Props) {
  const heading = meta.lang === "ja" ? "目次" : "Contents";
  return (
    <article className={className}>
      <h1 className="text-lg font-black pb-2">{heading}</h1>
      <ul className="list-none">
        {headings.map(({ value, depth }, i) => (
          <li className="mt-2" key={i}>
            <Link
              className={tw(
                apply(
                  "hover:text-blue-400 focus:text-blue-500 focus:underline flex items-center break-words",
                  depth === 3 ? "px-4 text-gray-800" : "px-2 font-medium",
                ),
              )}
              href={pagesPath
                .techblog.post
                ._uuid(meta.uuid)
                .$url({ hash: i.toString() })}
            >
              {depth === 3
                ? <ChevronRightIcon aria-hidden="true" className="h-4 w-4" />
                : null}
              {value}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
