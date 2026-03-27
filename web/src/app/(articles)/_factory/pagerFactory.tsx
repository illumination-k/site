import { css } from "@/styled-system/css";

import type { Metadata, ResolvingMetadata, Route } from "next";
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

type Params = z.input<typeof schema.params>;

export default class PagerFactory {
  private blogService: BlogService;
  private prefix: string;

  constructor(prefix: string, blogService: BlogService) {
    this.prefix = prefix;
    this.blogService = blogService;
  }

  public createGenerateMetadataFn() {
    return async (
      { params }: { params: Promise<Params> },
      _parent: ResolvingMetadata,
    ): Promise<Metadata> => {
      const { page } = await params;
      const title =
        page === "1"
          ? `${this.prefix} 記事一覧`
          : `${this.prefix} 記事一覧 - ページ ${page}`;
      const description = `illumination-k.dev の${this.prefix}記事一覧（ページ ${page}）`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `https://www.illumination-k.dev/${this.prefix}/${page}`,
        },
      };
    };
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
            bg: "bg.page",
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
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
