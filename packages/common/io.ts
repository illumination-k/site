import { PathLike, readFile } from "fs";
import { promisify } from "util";
import { Dump, DumpPost, dumpSchema, Lang, PostMeta } from ".";

import { Index, MeiliSearch } from "meilisearch";
import { z } from "zod";

export async function readDump(path: PathLike): Promise<Dump> {
  const readFileAsync = promisify(readFile);
  const _dump = JSON.parse(await (await readFileAsync(path)).toString());
  const parse = dumpSchema.safeParse(_dump);

  if (!parse.success) {
    console.error(parse.error);
    throw "Invalid dump file";
  }

  return parse.data;
}

const meilisearchSchema = z.object({
  MEILISEARCH_API_KEY: z.string().optional(),
  MEILISEARCH_URL: z.string().url().nullish(),
});

export type PostSearchKey = keyof Omit<PostMeta, "uuid"> | "rawMarkdown" | "id";
export type PostSearchRecord = Record<PostSearchKey, string>;

export function initTechblogMeiliSearchIndex(): Index<PostSearchRecord> {
  const indexName = "techblog";
  const envParse = meilisearchSchema.safeParse(process.env);
  if (!envParse.success) {
    throw envParse.error;
  }

  const host = envParse.data.MEILISEARCH_API_KEY || "localhost:7700";
  const apiKey = envParse.data.MEILISEARCH_API_KEY;

  const client = new MeiliSearch({ host, apiKey });
  return client.index(indexName);
}

export async function searchBlogPost(q: string): Promise<PostMeta[]> {
  const index = initTechblogMeiliSearchIndex();

  return await (await index.search(q, {})).hits.map((hit) => {
    const { id: uuid, title, lang, description, tags, category, created_at, updated_at } = hit;

    return {
      uuid,
      title,
      lang: lang as Lang,
      description,
      tags: tags.split(" "),
      category,
      created_at,
      updated_at,
    };
  });
}
