import { Lang, PostMeta } from "common";
import { IBlogRepositoy } from "./irepository";

import { MeiliSearch } from "meilisearch";

type SearchRecordKey = keyof Omit<PostMeta, "uuid"> | "id" | "markdown";
type SearchRecord = Record<SearchRecordKey, string>;

const indexName = "techblog";
const client = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || "localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

const meiliSearchIndex = client.index<SearchRecord>(indexName);

export async function registerBlogPosts(repo: IBlogRepositoy) {
  if (process.env.REGISTER_SKIP) {
    return;
  }

  const posts = await repo.list();
  await meiliSearchIndex.deleteAllDocuments();

  await meiliSearchIndex.addDocumentsInBatches(posts.map((post) => {
    const { uuid: id, lang, title, description, created_at, updated_at, tags, category } = post.meta;

    return {
      id,
      lang,
      title,
      description,
      created_at,
      updated_at,
      tags: tags.join(" "),
      category,
      markdown: post.stripMarkdown,
    };
  }));
}

export async function search(q: string): Promise<PostMeta[]> {
  const postMetas = (await meiliSearchIndex.search(q)).hits.map((hit) => {
    const { id: uuid, markdown: _, tags, lang, ...rest } = hit;

    return { uuid, tags: tags.split(" "), lang: lang as Lang, ...rest };
  });

  return postMetas;
}
