import { PathLike, readFile } from "fs";
import { promisify } from "util";

// @ts-ignore
import fm, { FrontMatterResult } from "front-matter";
import { glob } from "glob";
import tinysegmenter from "tiny-segmenter";

import { DumpPost, Post, PostMeta, postMetaSchema } from "common";

const readFileAsync = promisify(readFile);

export async function readPost(path: PathLike) {
  const rawPost = (await readFileAsync(path)).toString();
  const fmResult: FrontMatterResult<PostMeta> = fm(rawPost);

  const { created_at, updated_at, ...attrs } = fmResult.attributes;
  const meta = postMetaSchema.safeParse({
    ...attrs,
    created_at: new Date(created_at),
    updated_at: new Date(updated_at),
  });

  if (!meta.success) {
    throw new Error(JSON.stringify(meta.error, null, 2));
  }

  return { ...meta.data, markdown: fmResult.body };
}

function dumpPost(post: Post): DumpPost {
  const segmenter = new tinysegmenter();
  const tokens = segmenter.segment(post.markdown);
  return { ...post, tokens };
}

export async function getDumpPosts(src: PathLike): Promise<DumpPost[]> {
  const mdFiles = await glob(`${src}/**/*.md`, { ignore: "node_modules/*" });

  return Promise.all(mdFiles.map(async (f) => dumpPost(await readPost(f))));
}

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
created_at: ${new Date()}
updated_at: ${new Date()}
---
`;
  return template;
}
