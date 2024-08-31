import { Post, PostMeta } from "common";

/**
 * return array until stop from 1
 * @param stop number
 * @returns number[]
 */
export function range(stop: number): number[] {
  return Array.from({ length: stop }, (_, i) => i + 1);
}

export type PageInformation = {
  pagePostMetas: PostMeta[];
  curPage: number;
  pages: number[];
};

export class Pager {
  count_per_page: number;
  constructor(count_per_page: number) {
    this.count_per_page = count_per_page;
  }

  static sortPost(
    postMetas: PostMeta[],
    sortedBy: "updated_at" | "created_at" = "updated_at",
  ) {
    return postMetas.sort(function(a: PostMeta, b: PostMeta) {
      const a_date = new Date(a[sortedBy]);
      const b_date = new Date(b[sortedBy]);
      return b_date.valueOf() - a_date.valueOf();
    });
  }

  getTotalPage(posts: unknown[]): number {
    return Math.ceil(posts.length / this.count_per_page);
  }

  getPages(postMetas: PostMeta[]): number[] {
    return range(Math.ceil(postMetas.length / this.count_per_page));
  }

  getPageInformation(postMetas: PostMeta[], page: number): PageInformation {
    const COUNT_PER_PAGE = this.count_per_page;
    const end = page * COUNT_PER_PAGE;
    const start = end - COUNT_PER_PAGE;

    const sortedPost = Pager.sortPost(postMetas);

    const pagePostMetas = sortedPost.slice(start, end);
    const pages = this.getPages(postMetas);

    return {
      pagePostMetas,
      curPage: page,
      pages,
    };
  }
}

const pager = new Pager(10);
export default pager;
