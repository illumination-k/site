import { css } from "@/styled-system/css";

import type { Metadata } from "next";

import TagNetwork from "@/features/articles/components/TagNetwork";
import type BlogService from "@/features/articles/service";
import { type Locale, getDictionary, isLocale, localeToLang } from "@/lib/i18n";
import { buildAlternates, buildOpenGraph, buildTwitterCard } from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * Tag co-occurrence network page. Every article prefix whose tag index links to
 * `${prefix}/tag/network` needs a route built from this factory, otherwise that
 * link resolves to a 404.
 */
export default class TagNetworkPageFactory {
  private blogService: BlogService;
  private prefix: string;

  constructor(prefix: string, blogService: BlogService) {
    this.prefix = prefix;
    this.blogService = blogService;
  }

  public createGenerateMetadataFn() {
    return async ({ params }: Props): Promise<Metadata> => {
      const { locale: localeParam } = await params;
      const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
      const dict = await getDictionary(locale);

      const title = dict.meta.tagNetwork(this.prefix);
      const description = dict.meta.tagNetworkDescription(this.prefix);

      return {
        title,
        description,
        alternates: buildAlternates({
          canonicalLocale: locale,
          buildPath: (l) => `/${l}/${this.prefix}/tag/network`,
        }),
        openGraph: buildOpenGraph({
          title,
          description,
          path: `/${locale}/${this.prefix}/tag/network`,
          locale,
        }),
        twitter: buildTwitterCard({ title, description }),
      };
    };
  }

  public createPage() {
    const prefix = this.prefix;
    const blogService = this.blogService;

    const TagNetworkPage = async ({
      params, // eslint-disable-line react/prop-types
    }: Props) => {
      const { locale: localeParam } = await params;
      const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
      const lang = localeToLang(locale);
      const dict = await getDictionary(locale);

      const networkData = await blogService.repo.tagNetwork(lang);

      return (
        <div
          className={css({
            bg: "bg.page",
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          })}
        >
          <div
            className={css({
              gridColumnStart: "1",
              gridColumnEnd: "-1",
              lg: { gridColumnStart: "2", gridColumnEnd: "12" },
              p: 4,
            })}
          >
            <h1
              className={css({
                fontSize: "2xl",
                fontWeight: "bold",
                color: "text.primary",
                mb: 2,
              })}
            >
              {dict.meta.tagNetwork(prefix)}
            </h1>
            <p
              className={css({
                fontSize: "sm",
                color: "text.secondary",
                mb: 4,
              })}
            >
              {dict.meta.tagNetworkDescription(prefix)}
            </p>
            <div
              className={css({
                bg: "bg.surface",
                borderRadius: "xl",
                border: "1px solid",
                borderColor: "border.default",
                overflow: "hidden",
                position: "relative",
              })}
            >
              <TagNetwork
                nodes={networkData.nodes}
                edges={networkData.edges}
                prefix={`${locale}/${prefix}`}
              />
            </div>
          </div>
        </div>
      );
    };

    return TagNetworkPage;
  }
}
