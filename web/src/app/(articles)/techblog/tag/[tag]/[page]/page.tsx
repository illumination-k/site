import { css } from "@/styled-system/css";

import type { Metadata, Route } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Pager from "@/features/articles/components/Pager";
import pager from "@/features/articles/utils/pager";
import { blogService } from "@/features/techblog/constant";

const paramsSchema = z.object({
  tag: z.string(),
  page: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number()),
});

type Params = z.input<typeof paramsSchema>;

const schema = {
  params: paramsSchema,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
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
      url: `https://www.illumination-k.dev/techblog/tag/${tag}/${page}`,
    },
  };
}

export async function generateStaticParams(): Promise<Params[]> {
  const tags = await blogService.repo.tags();

  const nestedParams = await Promise.all(
    [...tags].map(async (tag) => {
      const tagged_posts = await blogService.repo.filterPosts("ja", tag);
      const totalPage = pager.getTotalPage(tagged_posts);
      return Array.from({ length: totalPage }, (_, i) => ({
        tag,
        page: String(i + 1),
      }));
    }),
  );

  return nestedParams.flat();
}

const TechBlogTagPage = withZodPage(schema, async ({ params }) => {
  const { page, tag } = params;
  const posts = await blogService.repo.filterPosts("ja", tag);
  const pageInformation = pager.getPageInformation(
    posts.map((p) => p.meta),
    page,
  );

  return (
    <div
      className={css({
        bg: "slate.50",
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
        prefix="techblog"
        pageInformation={pageInformation}
        pageLinkGenerator={(page) => `/techblog/tag/${tag}/${page}` as Route}
      />
    </div>
  );
});

export default TechBlogTagPage;
