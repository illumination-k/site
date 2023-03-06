import { PathLike, readFile, writeFile } from "fs";
import { promisify } from "util";

// @ts-ignore
import fm, { FrontMatterResult } from "front-matter";
import { glob } from "glob";
import tinysegmenter from "tiny-segmenter";

import { Dump, DumpPost, Post, PostMeta, postMetaSchema } from "common";

const readFileAsync = promisify(readFile);

export async function readPost(path: PathLike): Promise<Post> {
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

  return { meta: meta.data, markdown: fmResult.body };
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

async function getDump(dumpPosts: DumpPost[]): Promise<Dump> {
  const tags = [...new Set(dumpPosts.map((p) => p.meta.tags).flat())];
  const categories = [...new Set(dumpPosts.map((p) => p.meta.category))];

  return {
    tags,
    categories,
    posts: dumpPosts,
  };
}

async function writeDump(path: PathLike, dump: Dump) {
  const writeAsync = promisify(writeFile);

  await writeAsync(path, JSON.stringify(dump, null, 2));
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
