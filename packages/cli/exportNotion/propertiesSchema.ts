import { z } from "zod";

const urlSchema = z.object({
  type: z.literal("url"),
  url: z.string(),
});

const nullableUrlSchema = z.object({
  type: z.literal("url"),
  url: z.string().nullish()
});

const multiSelectSchema = z.object({
  id: z.string(),
  type: z.literal("multi_select"),
  multi_select: z.array(
    z.object({
      name: z.string(),
    }),
  ),
});

const richTextSchema = z.object({
  id: z.string(),
  type: z.literal("rich_text"),
  rich_text: z.array(
    z.object({
      type: z.literal("text"),
      plain_text: z.string(),
    }),
  ),
});

const titleSchema = z.object({
  id: z.string(),
  type: z.literal("title"),
  title: z.array(
    z.object({
      type: z.literal("text"),
      plain_text: z.string(),
    }),
  ),
});

export const propertiesSchema = z.object({
  URL: urlSchema,
  Github: nullableUrlSchema,
  Name: titleSchema,
  AiDesc: richTextSchema,
  Tag: multiSelectSchema,
  Journal: multiSelectSchema,
});

export type Properties = z.infer<typeof propertiesSchema>;

export const pageObjectSchema = z.object({
  id: z.string().uuid(),
  created_time: z.string(),
  last_edited_time: z.string(),
  properties: propertiesSchema,
});
