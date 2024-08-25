import Pager from "@/features/techblog/components/Pager";
import { blogService } from "@/features/techblog/constant";
import pager from "@/features/techblog/utils/pager";

import { withZodPage } from "@/app/_util/withZodPage";
import { z } from "zod";
import { Route } from "next";

const schema = {
  params: z.object({ page: z.string().transform((v) => Number(v)).pipe(z.number()) }),
};

const TechBlogPage = withZodPage(schema, async ({ params }) => {
  const posts = await blogService.repo.filterPosts("ja");
  const pageInformation = pager.getPageInformation(posts.map((p) => p.meta), params.page);

  return <Pager pageInformation={pageInformation} pageLinkGenerator={(page) => `/techblog/${page}` as Route} />;
});

export default TechBlogPage;
