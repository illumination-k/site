import Link from "next/link";

import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";

import { TagIcon } from "@heroicons/react/24/outline";
import type { PostMeta } from "common";
import type { Route } from "next";

import Tag from "./Tag";

interface PostCardProps {
  prefix: string;
  meta: PostMeta;
}

export default function PostCard({ prefix, meta }: PostCardProps) {
  return (
    <article
      className={css({
        px: 6,
        py: 4,
        rounded: "xl",
        bg: "bg.surface",
        my: 3,
        mx: 4,
        borderWidth: 1,
        borderColor: "border.default",
        transition: "all",
        transitionDuration: "normal",
        _hover: {
          borderColor: "accent.primary",
          transform: "translateY(-2px)",
          shadow: "0 4px 20px rgba(14, 165, 233, 0.15)",
        },
      })}
    >
      <h2
        className={flex({
          fontWeight: "bold",
          fontSize: "2xl",
          justifyContent: "space-between",
          color: "text.primary",
          transition: "colors",
          transitionDuration: "fast",
          _hover: { color: "accent.primary" },
        })}
      >
        <Link href={`/${prefix}/post/${meta.uuid}` as Route}>{meta.title}</Link>
      </h2>

      <p className={css({ color: "text.tertiary", fontSize: "sm" })}>
        更新: {meta.updated_at}
      </p>

      <div
        className={css({
          display: "flex",
          gap: 2,
          py: 2,
          alignItems: "center",
          hideBelow: "md",
        })}
      >
        <TagIcon
          className={css({
            h: 5,
            w: 5,
            hideBelow: "md",
            color: "text.tertiary",
          })}
        />
        {meta.tags.map((tag, i) => (
          <Tag prefix={prefix} tag={tag} key={i} />
        ))}
      </div>

      <p className={css({ px: 2, color: "text.secondary" })}>
        {meta.description}
      </p>
    </article>
  );
}
