import { css } from "@/styled-system/css";

import type { Route } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Pager from "@/features/articles/components/Pager";
import pager from "@/features/articles/utils/pager";
import { blogService } from "@/features/techblog/constant";

const schema = {
  params: z.object({
    page: z
      .string()
      .transform((v) => Number(v))
      .pipe(z.number()),
  }),
};

export async function generateStaticParams() {
  const posts = await blogService.repo.filterPosts("ja");
  const totalPage = pager.getTotalPage(posts);
  return Array.from({ length: totalPage }, (_, i) => ({ page: String(i + 1) }));
}

const TechBlogPage = withZodPage(schema, async ({ params }) => {
  const { page } = params;
  const posts = await blogService.repo.filterPosts("ja");
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
        pageLinkGenerator={(page) => `/techblog/${page}` as Route}
      />
    </div>
  );
});

export default TechBlogPage;