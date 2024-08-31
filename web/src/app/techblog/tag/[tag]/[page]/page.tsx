import { css } from "@/styled-system/css";

import type { Route } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Pager from "@/features/techblog/components/Pager";
import { blogService } from "@/features/techblog/constant";
import pager from "@/features/techblog/utils/pager";

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

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await blogService.repo.filterPosts("ja");
  const tags = new Set<string>();
  posts.forEach((post) => post.meta.tags.forEach((tag) => tags.add(tag)));

  console.log("tags", tags);

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
        gridTemplateColumns: "12",
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
