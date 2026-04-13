import { css } from "@/styled-system/css";

import type { Metadata, ResolvingMetadata, Route } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Pager from "@/features/articles/components/Pager";
import Tag from "@/features/articles/components/Tag";
import type BlogService from "@/features/articles/service";
import pager from "@/features/articles/utils/pager";
import {
  type Locale,
  getDictionary,
  isLocale,
  localeToLang,
  locales,
} from "@/lib/i18n";

const schema = {
  params: z.object({
    locale: z.string(),
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
      {
        params,
      }: { params: Promise<{ locale: string; tag: string; page: string }> },
      _parent: ResolvingMetadata,
    ): Promise<Metadata> => {
      const { tag, page, locale: localeParam } = await params;
      const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
      const dict = await getDictionary(locale);

      const title =
        page === "1"
          ? dict.meta.tagArticleList(tag)
          : dict.meta.tagArticleListPage(tag, page);
      const description = dict.meta.tagArticleListDescription(tag, page);

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `https://www.illumination-k.dev/${locale}/${this.prefix}/tag/${tag}/${page}`,
        },
      };
    };
  }

  public createGenerateStaticParamsFn(): () => Promise<
    { locale: string; tag: string; page: string }[]
  > {
    return async () => {
      const tags = await this.blogService.repo.tags();

      const nestedParams = await Promise.all(
        locales.flatMap((locale) => {
          const lang = localeToLang(locale);
          return [...tags].map(async (tag) => {
            const tagged_posts = await this.blogService.repo.filterPosts(
              lang,
              tag,
            );
            const totalPage = pager.getTotalPage(tagged_posts);
            return Array.from({ length: totalPage }, (_, i) => ({
              locale,
              tag,
              page: String(i + 1),
            }));
          });
        }),
      );

      return nestedParams.flat();
    };
  }

  public createPage() {
    return withZodPage(schema, async ({ params }) => {
      const { page, tag, locale: localeParam } = params;
      const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
      const lang = localeToLang(locale);
      const posts = await this.blogService.repo.filterPosts(lang, tag);
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
            prefix={`${locale}/${this.prefix}`}
            pageInformation={pageInformation}
            pageLinkGenerator={(page) =>
              `/${locale}/${this.prefix}/tag/${tag}/${page}` as Route
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

  public createGenerateMetadataFn() {
    return async ({
      params,
    }: {
      params: Promise<{ locale: string }>;
    }): Promise<Metadata> => {
      const { locale: localeParam } = await params;
      const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
      const dict = await getDictionary(locale);

      return {
        title: dict.meta.tagList(this.prefix),
        description: dict.meta.tagListDescription(this.prefix),
        openGraph: {
          title: dict.meta.tagList(this.prefix),
          description: dict.meta.tagListDescription(this.prefix),
          url: `https://www.illumination-k.dev/${locale}/${this.prefix}/tag`,
        },
      };
    };
  }

  public createPage() {
    const TagPage = async ({
      params, // eslint-disable-line react/prop-types
    }: {
      params: Promise<{ locale: string }>;
    }) => {
      const { locale: localeParam } = await params;
      const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
      const tags = await this.blogService.repo.tags();

      return (
        <div
          className={css({ p: 5, display: "flex", flexWrap: "wrap", gap: 3 })}
        >
          {tags.map((tag) => (
            <Tag
              key={tag}
              prefix={`${locale}/${this.prefix}`}
              tag={tag}
              className={css({})}
            />
          ))}
        </div>
      );
    };

    return TagPage;
  }
}
