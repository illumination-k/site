import { css } from "@/styled-system/css";

import type { Metadata, ResolvingMetadata, Route } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Pager from "@/features/articles/components/Pager";
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
      const { page, locale: localeParam } = await params;
      const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
      const dict = await getDictionary(locale);

      const title =
        page === "1"
          ? dict.meta.articleList(this.prefix)
          : dict.meta.articleListPage(this.prefix, page);
      const description = dict.meta.articleListDescription(this.prefix, page);

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `https://www.illumination-k.dev/${locale}/${this.prefix}/${page}`,
        },
      };
    };
  }

  public createGenerateStaticParamsFn(): () => Promise<
    { locale: string; page: string }[]
  > {
    return async () => {
      const results = await Promise.all(
        locales.map(async (locale) => {
          const lang = localeToLang(locale);
          const posts = await this.blogService.repo.filterPosts(lang);
          const totalPage = Math.max(1, pager.getTotalPage(posts));
          return Array.from({ length: totalPage }, (_, i) => ({
            locale,
            page: String(i + 1),
          }));
        }),
      );
      return results.flat();
    };
  }

  public createPage() {
    return withZodPage(schema, async ({ params }) => {
      const { page, locale: localeParam } = params;
      const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
      const lang = localeToLang(locale);
      const posts = await this.blogService.repo.filterPosts(lang);
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
              `/${locale}/${this.prefix}/${page}` as Route
            }
          />
        </div>
      );
    });
  }
}
