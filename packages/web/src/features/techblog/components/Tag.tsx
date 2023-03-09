import { apply, tw } from "@twind/core";
import Link from "next/link";

import { pagesPath } from "@/lib/$path";

type TagProps = {
  tag: string;
  className?: string;
};

export default function Tag({ tag, className }: TagProps) {
  return (
    <span
      className={tw(apply(
        "rounded-3xl bg-blue-100 font-bold px-4 py-1 font-sans hover:bg-blue-500 hover:text-white",
        className,
      ))}
    >
      <Link href={pagesPath.techblog.tags._tag(tag)._page(1).$url()}>
        {tag}
      </Link>
    </span>
  );
}
