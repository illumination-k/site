import { css } from "@/styled-system/css";

import type { Metadata, ResolvingMetadata } from "next";
import type { Route } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Pager from "@/features/articles/components/Pager";
import Tag from "@/features/articles/components/Tag";
import type BlogService from "@/features/articles/service";
import pager from "@/features/articles/utils/pager";

const schema = {
  params: z.object({
    tag: z.string(),
    page: z
      .string()
      .transform((v) => Number(v))
      .pipe(z.number()),
  }),
};

export class TagPagerFactory {
  private blogService: BlogService;
  private prefix: string;

  constructor(prefix: string, blogService: BlogService) {
    this.prefix = prefix;
    this.blogService = blogService;
  }

  public createGenerateMetadataFn() {
    return async (
      { params }: { params: Promise<{ tag: string; page: string }> },
      _parent: ResolvingMetadata,
    ): Promise<Metadata> => {
      const { tag, page } = await params;
      const title =
        page === "1"
          ? `${tag} タグの記事一覧`
          : `${tag} タグの記事一覧 - ページ ${page}`;
      const description = `illumination-k.dev の「${tag}」タグが付いた記事一覧（ページ ${page}）`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `https://www.illumination-k.dev/${this.prefix}/tag/${tag}/${page}`,
        },
      };
    };
  }

  public createGenerateStaticParamsFn(): () => Promise<
    { tag: string; page: string }[]
  > {
    return async () => {
      const tags = await this.blogService.repo.tags();

      const nestedParams = await Promise.all(
        [...tags].map(async (tag) => {
          const tagged_posts = await this.blogService.repo.filterPosts(
            "ja",
            tag,
          );
          const totalPage = pager.getTotalPage(tagged_posts);
          return Array.from({ length: totalPage }, (_, i) => ({
            tag,
            page: String(i + 1),
          }));
        }),
      );

      return nestedParams.flat();
    };
  }

  public createPage() {
    return withZodPage(schema, async ({ params }) => {
      const { page, tag } = params;
      const posts = await this.blogService.repo.filterPosts("ja", tag);
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
            pageLinkGenerator={(page) =>
              `${this.prefix}/${tag}/${page}` as Route
            }
          />
        </div>
      );
    });
  }
}

export class TagTopPageFactory {
  private blogService: BlogService;
  private prefix: string;

  constructor(prefix: string, blogService: BlogService) {
    this.prefix = prefix;
    this.blogService = blogService;
  }

  public createMetadata(): Metadata {
    return {
      title: `${this.prefix} タグ一覧`,
      description: `illumination-k.dev の${this.prefix}記事に付けられたタグの一覧`,
      openGraph: {
        title: `${this.prefix} タグ一覧`,
        description: `illumination-k.dev の${this.prefix}記事に付けられたタグの一覧`,
        url: `https://www.illumination-k.dev/${this.prefix}/tag`,
      },
    };
  }

  public createPage() {
    const TagPage = async () => {
      const tags = await this.blogService.repo.tags();

      return (
        <div
          className={css({ p: 5, display: "flex", flexWrap: "wrap", gap: 3 })}
        >
          {tags.map((tag) => (
            <Tag key={tag} prefix={this.prefix} tag={tag} className={css({})} />
          ))}
        </div>
      );
    };

    return TagPage;
  }
}
