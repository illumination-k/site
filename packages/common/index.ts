import { z } from "zod";
import { formatDate } from "./utils";

const lang = z.enum(["ja", "en"]);
export type Lang = z.infer<typeof lang>;

const dateSchema = z
  .union([z.string(), z.date()])
  .pipe(z.coerce.date())
  .transform((date) => formatDate(date));

export const postMetaSchema = z.object({
  uuid: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  lang: lang,
  created_at: dateSchema,
  updated_at: dateSchema,
});

export type PostMeta = z.infer<typeof postMetaSchema>;
export const postMetasSchema = z.array(postMetaSchema);
export const postSchema = z.object({
  meta: postMetaSchema,
  markdown: z.string(),
});

export type Post = z.infer<typeof postSchema>;

export const postsSchema = z.array(postSchema);
export type Posts = z.infer<typeof postsSchema>;

export const headingsSchema = z.array(
  z.object({ depth: z.number(), value: z.string() }),
);
export type Headings = z.infer<typeof headingsSchema>;

export const dumpPostSchema = postSchema.omit({ markdown: true }).extend({
  rawMarkdown: z.string(),
  headings: headingsSchema,
  compiledMarkdown: z.string(),
});
export type DumpPost = z.infer<typeof dumpPostSchema>;

export const dumpSchema = z.object({
  posts: z.array(dumpPostSchema),
  categories: z.array(z.string()),
  tags: z.array(z.string()),
});

export type Dump = z.infer<typeof dumpSchema>;

export type Heading = { depth: number; content: string };
