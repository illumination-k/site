import { DumpPost } from "common";
import { initTechblogMeiliSearchIndex } from "common/io";

export async function registerBlogPosts(dposts: DumpPost[]) {
  const index = initTechblogMeiliSearchIndex();

  await index.deleteAllDocuments();
  await index.addDocumentsInBatches(dposts.map((dpost) => {
    const { uuid: id, title, lang, description, tags, category, created_at, updated_at } = dpost.meta;

    return {
      id,
      title,
      lang,
      description,
      tags: tags.join(" "),
      category,
      created_at,
      updated_at,
      rawMarkdown: dpost.rawMarkdown,
    };
  }));
}
