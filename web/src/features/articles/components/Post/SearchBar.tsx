"use client";

import { css, cx } from "@/styled-system/css";

import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

interface Props {
  className?: string;
  category?: string;
}

export default function SearchBar({ className, category }: Props) {
  return (
    <form
      className={cx(css({ display: "flex" }), className)}
      action="/search"
      method="GET"
    >
      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      <input
        type="text"
        className={css({ bg: "white", roundedLeft: "lg", px: 2, py: 1 })}
        name="q"
        placeholder="Search articles..."
      />
      <button
        type="submit"
        className={css({
          bg: "blue.400",
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
