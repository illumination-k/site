import { css } from "@/styled-system/css";

import type { Route } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Pager from "@/features/articles/components/Pager";
import type BlogService from "@/features/articles/service";
import pager from "@/features/articles/utils/pager";

const schema = {
  params: z.object({
    page: z
      .string()
      .transform((v) => Number(v))
      .pipe(z.number()),
  }),
};

export default class PagerFactory {
  private blogService: BlogService;
  private prefix: string;

  constructor(prefix: string, blogService: BlogService) {
    this.prefix = prefix;
    this.blogService = blogService;
  }

  public createGenerateStaticParamsFn(): () => Promise<{ page: string }[]> {
    return async () => {
      const posts = await this.blogService.repo.filterPosts("ja");
      const totalPage = pager.getTotalPage(posts);
      return Array.from({ length: totalPage }, (_, i) => ({
        page: String(i + 1),
      }));
    };
  }

  public createPage() {
    return withZodPage(schema, async ({ params }) => {
      const { page } = params;
      const posts = await this.blogService.repo.filterPosts("ja");
      const pageInformation = pager.getPageInformation(
        posts.map((p) => p.meta),
        page,
      );

      return (
        <div
          className={css({
            bg: "slate.50",
            display: "grid",
            gridTemplateColumns: "12",
          })}
        >
          <Pager
            className={css({
              gridColumnStart: "1",
              gridColumnEnd: "-1",
              lg: { gridColumnStart: "3", gridColumnEnd: "11" },
            })}
            prefix={this.prefix}
            pageInformation={pageInformation}
            pageLinkGenerator={(page) => `/${this.prefix}/${page}` as Route}
          />
        </div>
      );
    });
  }
}
