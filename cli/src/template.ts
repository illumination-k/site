import { randomUUID } from "node:crypto";
import type { PostMeta } from "common";
import { formatDate } from "common/utils";
import YAML from "yaml";

const DEFAULT_POST_META: PostMeta = {
  uuid: randomUUID(),
  title: "",
  description: "",
  category: "",
  lang: "ja",
  tags: [],
  created_at: formatDate(new Date()),
  updated_at: formatDate(new Date()),
};

export function template(tags?: string[]): string {
  const meta = {
    ...DEFAULT_POST_META,
    uuid: randomUUID(),
    ...(tags ? { tags } : {}),
  };
  const template = `---
${YAML.stringify(meta).trim()}
---
`;
  return template;
}

export function templateFromPostMeta(postMeta: PostMeta): string {
  const template = `---
${YAML.stringify(postMeta).trim()}
`;

  return template;
}
