import Link from "next/link";

import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";

import { CalendarIcon, TagIcon } from "@heroicons/react/24/outline";
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
        position: "relative",
        rounded: "xl",
        bg: "bg.surface",
        my: 3,
        mx: { base: 2, md: 4 },
        borderWidth: 1,
        borderColor: "border.default",
        overflow: "hidden",
        transition: "all",
        transitionDuration: "normal",
        _before: {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          bg: "accent.primary",
          opacity: 0.3,
          transition: "opacity",
          transitionDuration: "normal",
        },
        _hover: {
          borderColor: "accent.primary",
          transform: "translateY(-2px)",
          shadow: "0 8px 30px rgba(14, 165, 233, 0.12)",
          _before: {
            opacity: 1,
          },
        },
      })}
    >
      <div className={css({ px: 6, py: 5 })}>
        {/* Top row: category badge + date */}
        <div
          className={flex({
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          })}
        >
          <span
            className={css({
              fontSize: "xs",
              fontWeight: "semibold",
              textTransform: "uppercase",
              letterSpacing: "wide",
              color: "accent.primary",
              bg: "accent.muted",
              px: 3,
              py: 0.5,
              rounded: "full",
            })}
          >
            {meta.category}
          </span>
          <span
            className={flex({
              alignItems: "center",
              gap: 1,
              color: "text.tertiary",
              fontSize: "xs",
            })}
          >
            <CalendarIcon className={css({ h: 3.5, w: 3.5 })} />
            {meta.updated_at}
          </span>
        </div>

        {/* Title */}
        <h2
          className={css({
            fontWeight: "bold",
            fontSize: { base: "lg", md: "xl" },
            lineHeight: "tight",
            color: "text.primary",
            mb: 2,
            transition: "colors",
            transitionDuration: "fast",
            _hover: { color: "accent.primary" },
          })}
        >
          <Link href={`/${prefix}/post/${meta.uuid}` as Route}>
            {meta.title}
          </Link>
        </h2>

        {/* Description */}
        <p
          className={css({
            color: "text.secondary",
            fontSize: "sm",
            lineHeight: "relaxed",
            mb: 3,
            lineClamp: 2,
          })}
        >
          {meta.description}
        </p>

        {/* Tags */}
        {meta.tags.length > 0 && (
          <div
            className={flex({
              gap: 1.5,
              alignItems: "center",
              flexWrap: "wrap",
            })}
          >
            <TagIcon
              className={css({
                h: 4,
                w: 4,
                color: "text.tertiary",
                flexShrink: 0,
              })}
            />
            {meta.tags.map((tag, i) => (
              <Tag prefix={prefix} tag={tag} key={i} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
