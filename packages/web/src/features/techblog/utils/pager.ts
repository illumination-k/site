import { Post } from "common";

/**
 * return array until stop from 1
 * @param stop number
 * @returns number[]
 */
export function range(stop: number): number[] {
  return Array.from({ length: stop }, (_, i) => i + 1);
}

export type PageInfomation = {
  pagePosts: Post[];
  curPage: number;
  pages: number[];
};

export class Pager {
  count_per_page: number;
  constructor(count_per_page: number) {
    this.count_per_page = count_per_page;
  }

  static sortPost(
    posts: Post[],
    sortedBy: "updated_at" | "created_at" = "updated_at",
  ) {
    return posts.sort(function(a: Post, b: Post) {
      const a_date = new Date(a.meta[sortedBy]);
      const b_date = new Date(b.meta[sortedBy]);
      return b_date.valueOf() - a_date.valueOf();
    });
  }

  getTotalPage(posts: Post[]): number {
    return Math.ceil(posts.length / this.count_per_page);
  }

  getPages(posts: Post[]): number[] {
    return range(Math.ceil(posts.length / this.count_per_page));
  }

  getPageInformation(posts: Post[], page: number): PageInfomation {
    const COUNT_PER_PAGE = this.count_per_page;
    const end = page * COUNT_PER_PAGE;
    const start = end - COUNT_PER_PAGE;

    const sortedPost = Pager.sortPost(posts);

    const pagePosts = sortedPost.slice(start, end);
    const pages = this.getPages(posts);

    return {
      pagePosts,
      curPage: page,
      pages,
    };
  }
}

const pager = new Pager(10);
export default pager;
