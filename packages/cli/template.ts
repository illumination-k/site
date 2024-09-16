import { formatDate } from "common/utils";
import { PostMeta } from "common";

function generateUuid() {
  // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
  // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
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

export function template(): string {
  const template = `---
uuid: ${generateUuid()}
title:
description:
lang: ja
tags:
    - techblog
categories:
created_at: ${formatDate(new Date())}
updated_at: ${formatDate(new Date())}
---
`;
  return template;
}

export function templateFromPostMeta(postMeta: PostMeta): string {
  const template = `---
uuid: ${postMeta.uuid}
title: ${postMeta.title}
description: ${postMeta.description}
lang: ja
`;

  return template;
}
