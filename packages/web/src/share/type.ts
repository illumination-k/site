import { z } from "zod";

export const postMetaSchema = z.object({
  uuid: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  lang: z.enum(["ja", "en"]),
  created_at: z.date(),
  updated_at: z.date(),
});

export type PostMeta = z.infer<typeof postMetaSchema>;

export const postSchema = postMetaSchema.extend({ markdown: z.string() });
export type Post = z.infer<typeof postSchema>;

export const postsSchema = z.array(postSchema);
export type Posts = z.infer<typeof postsSchema>;

export type Heading = { depth: number; content: string };
