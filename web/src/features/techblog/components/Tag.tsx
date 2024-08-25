import { apply, tw } from "@twind/core";
import Link from "next/link";

import { pagesPath } from "@/lib/$path";

type TagProps = {
  tag: string;
  className?: string;
};

export default function Tag({ tag, className }: TagProps) {
  let tagColor = "bg-blue-100 hover:bg-blue-500";

  if (tag === "archive") {
    tagColor = "bg-yellow-100 hover:bg-yellow-500";
  } else if (tag === "draft") {
    tagColor = "bg-gray-100 hover:bg-gray-500";
  }

  return (
    <span
      className={tw(apply(
        "rounded-3xl font-bold px-4 py-1 font-sans hover:text-white",
        tagColor,
        className,
      ))}
    >
      <Link href={pagesPath.techblog.tags._tag(tag)._page(1).$url()}>
        {tag}
      </Link>
    </span>
  );
}
