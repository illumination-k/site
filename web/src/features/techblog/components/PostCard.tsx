import Link from "next/link";

import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";

import { TagIcon } from "@heroicons/react/24/outline";
import type { PostMeta } from "common";

import Tag from "./Tag";

interface PostCardProps {
  prefix: string;
  meta: PostMeta;
}

export default function PostCard({ prefix, meta }: PostCardProps) {
  return (
    <article className={css({ px: 8, py: 2, rounded: "lg", bg: "white", my: 3, mx: 4, borderWidth: 1 })}>
      <h2
        className={flex({
          fontWeight: "bold",
          fontSize: "2xl",
          justifyContent: "space-between",
          _hover: { color: "blue.400", textDecoration: "underline" },
        })}
      >
        <Link
          href={`/techblog/post/${meta.uuid}`}
        >
          {meta.title}
        </Link>
      </h2>

      <p>更新: {meta.updated_at}</p>

      <div className={css({ display: "flex", gap: 2, py: 2, alignItems: "center", hideBelow: "md" })}>
        <TagIcon className={css({ h: 5, w: 5, hideBelow: "md" })} />
        {meta.tags.map((tag, i) => <Tag prefix={prefix} tag={tag} key={i} />)}
      </div>

      <p className="px-2">{meta.description}</p>
    </article>
  );
}
