import type { Metadata } from "next";

import { css } from "@/styled-system/css";

import TagNetwork from "@/features/articles/components/TagNetwork";
import { blogService } from "@/features/techblog/constant";
import {
  type Locale,
  getDictionary,
  isLocale,
  localeToLang,
} from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const dict = await getDictionary(locale);

  const title = dict.meta.tagNetwork("techblog");
  const description = dict.meta.tagNetworkDescription("techblog");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.illumination-k.dev/${locale}/techblog/tag/network`,
    },
  };
}

export default async function TagNetworkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
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
          {dict.meta.tagNetwork("techblog")}
        </h1>
        <p
          className={css({
            fontSize: "sm",
            color: "text.secondary",
            mb: 4,
          })}
        >
          {dict.meta.tagNetworkDescription("techblog")}
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
            prefix={`${locale}/techblog`}
          />
        </div>
      </div>
    </div>
  );
}
