import { PathLike, readFile } from "fs";
import { promisify } from "util";
import { Dump, dumpSchema, PostMeta } from ".";

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

  const host = envParse.data.MEILISEARCH_URL || "localhost:7700";
  const apiKey = envParse.data.MEILISEARCH_API_KEY;

  const client = new MeiliSearch({ host, apiKey });
  return client.index(indexName);
}
