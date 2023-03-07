import { pagesPath } from "@/lib/$path";
import { Headings, PostMeta } from "common";
import Link from "next/link";

type Props = {
  meta: PostMeta;
  headings: Headings;
};

export default function Toc({ headings, meta }: Props) {
  return (
    <ul className="list-none">
      {headings.map(({ value, depth }, i) => (
        <li key={i}>
          <Link
            href={pagesPath
              .techblog.post
              ._uuid(meta.uuid)
              .$url({ hash: i.toString() })}
          >
            {value}
          </Link>
        </li>
      ))}
    </ul>
  );
}
