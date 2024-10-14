import type { PostMeta } from "common";
import { formatDate } from "common/utils";
import YAML from "yaml";
import * as uuid from "uuid";

const DEFAULT_POST_META: PostMeta = {
  uuid: uuid.v4(),
  title: "",
  description: "",
  category: "",
  lang: "ja",
  tags: [],
  created_at: formatDate(new Date()),
  updated_at: formatDate(new Date()),
};

export function template(): string {
  const template = `---
${YAML.stringify(DEFAULT_POST_META).trim()}
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
