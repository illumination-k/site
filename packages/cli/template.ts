import type { PostMeta } from "common";
import { formatDate } from "common/utils";
import YAML from "yaml";

function generateUuid() {
  // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
  // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  const chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
  for (let i = 0, len = chars.length; i < len; i++) {
    switch (chars[i]) {
      case "x":
        chars[i] = Math.floor(Math.random() * 16).toString(16);
        break;
      case "y":
        chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
        break;
    }
  }
  return chars.join("");
}

const DEFAULT_POST_META: PostMeta = {
  uuid: generateUuid(),
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
