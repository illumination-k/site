import { TagIcon } from "@heroicons/react/24/outline";
import { PostMeta } from "common";
import Link from "next/link";

import Tag from "./Tag";

import Category from "@/icons/Category";
import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";

export default function PostCard({ meta }: { meta: PostMeta }) {
  return (
    <article className={css({ px: 8, py: 2, rounded: "lg", bg: "white", my: 3, mx: 4, borderWidth: 1 })}>
      <Link
        href={"/"}
      >
        <h2
          className={flex({
            fontWeight: "bold",
            fontSize: "2xl",
            justifyContent: "space-between",
            _hover: { color: "blue.400", textDecoration: "underline" },
          })}
        >
          {meta.title}
        </h2>
      </Link>

      <div className={flex({ px: 1, py: 2, fontFamily: "semibold", gap: 4 })}>
        <p className={css({ fontWeight: "bold" })}>作成</p>
        <p>{meta.created_at}</p>
        <p className={css({ fontWeight: "bold" })}>更新</p>
        <p>{meta.updated_at}</p>
      </div>
      <div className={css({ md: { "flex": "1" } })}>
        <div className={flex({ gap: 2, alignItems: "center" })}>
          <Category className={css({ h: 5, w: 5 })} />
          <Link
            className={css({ fontWeight: "bold", _hover: { color: "blue.400" } })}
            href={"/"}
          >
            {meta.category}
          </Link>
        </div>
        <div className={flex({ gap: 2, py: 2, alignItems: "center" })}>
          <TagIcon className={css({ h: 5, w: 5, hideBelow: "md" })} />
          {meta.tags.map((tag, i) => <Tag tag={tag} key={i} />)}
        </div>
      </div>

      <p className="px-2">{meta.description}</p>
    </article>
  );
}
