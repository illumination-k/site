import { Post } from "common";

/**
 * return array until stop from 1
 * @param stop number
 * @returns number[]
 */
export function range(stop: number): number[] {
  return Array.from({ length: stop }, (_, i) => i + 1);
}

export function sortPost(
  posts: Post[],
  sortedBy: "updated_at" | "created_at" = "updated_at",
) {
  return posts.sort(function(a: Post, b: Post) {
    const a_date = new Date(a.meta[sortedBy]);
    const b_date = new Date(b.meta[sortedBy]);
    return b_date.valueOf() - a_date.valueOf();
  });
}

export type PageInfo = {
  posts: Post[];
  page: number;
  totalPages: number;
};

export function getPageInfo(
  posts: Post[],
  page: number,
  COUNT_PER_PAGE: number,
): PageInfo {
  const end = page * COUNT_PER_PAGE;
  const start = end - COUNT_PER_PAGE;

  const sortedPost = sortPost(posts);

  const postsInfo = sortedPost.slice(start, end);
  const totalPages = Math.ceil(sortedPost.length / COUNT_PER_PAGE);

  return {
    posts: postsInfo,
    page,
    totalPages,
  };
}
