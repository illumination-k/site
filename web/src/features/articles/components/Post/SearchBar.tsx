"use client";

import { css, cx } from "@/styled-system/css";

import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

interface Props {
  className?: string;
  category?: string;
  locale?: string;
}

export default function SearchBar({
  className,
  category,
  locale = "ja",
}: Props) {
  return (
    <form
      className={cx(css({ display: "flex" }), className)}
      action={`/${locale}/search`}
      method="GET"
    >
      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      <input
        type="text"
        className={css({
          bg: "bg.input",
          roundedLeft: "lg",
          px: 2,
          py: 1,
          color: "text.primary",
          borderWidth: 1,
          borderColor: "border.default",
          _placeholder: { color: "text.tertiary" },
        })}
        name="q"
        placeholder="Search articles..."
      />
      <button
        type="submit"
        className={css({
          bg: "accent.primary",
          color: "white",
          px: 1,
          roundedRight: "lg",
        })}
      >
        <MagnifyingGlassIcon className={css({ w: 6, h: 6 })} />
      </button>
    </form>
  );
}
