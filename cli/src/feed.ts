import fs, { type PathLike } from "node:fs";
import { type Author, Feed } from "feed";

import path from "node:path";
import { promisify } from "node:util";
import type { DumpPost, Lang } from "common";
import { readDump } from "common/io";

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Primary language wins when a post exists in multiple languages. Falls
// back through the list so every post appears exactly once in the feed.
const LANG_PRIORITY: Record<Lang, number> = { ja: 0, en: 1, es: 2 };

function pickPrimaryVersions(posts: DumpPost[]): DumpPost[] {
  const byUuid = new Map<string, DumpPost>();
  for (const post of posts) {
    const existing = byUuid.get(post.meta.uuid);
    if (
      !existing ||
      LANG_PRIORITY[post.meta.lang] < LANG_PRIORITY[existing.meta.lang]
    ) {
      byUuid.set(post.meta.uuid, post);
    }
  }
  return Array.from(byUuid.values());
}

export default async function generateFeed(dumpPath: PathLike, dst: PathLike) {
  const dump = await readDump(dumpPath);
  const url = "https://www.illumination-k.dev";
  const now = new Date();

  const author: Author = {
    name: "illumination-k",
    email: "illumination-k@gmail.com",
    link: url,
  };

  const feed = new Feed({
    title: "illumination-k.dev",
    description: "Feed/Rss/Atom for illumination-k.dev",
    author: author,
    id: url,
    link: url,
    updated: now,
    copyright: `All rights reserved ${now.getFullYear()}, ${author.name}`,
    feedLinks: {
      rss2: `${url}/rss/feed.xml`,
      json: `${url}/rss/feed.json`,
      atom: `${url}/rss/atom.xml`,
    },
  });

  const posts = pickPrimaryVersions(dump.posts).sort(
    (a, b) =>
      new Date(b.meta.updated_at).getTime() -
      new Date(a.meta.updated_at).getTime(),
  );

  for (const post of posts) {
    const postUrl = `${url}/${post.meta.lang}/techblog/post/${post.meta.uuid}`;
    feed.addItem({
      title: post.meta.title,
      description: post.meta.description,
      id: postUrl,
      link: postUrl,
      date: new Date(post.meta.updated_at),
    });
  }

  await mkdirAsync(dst, { recursive: true });

  await writeFileAsync(path.join(dst.toString(), "feed.xml"), feed.rss2());
  await writeFileAsync(path.join(dst.toString(), "atom.xml"), feed.atom1());
  await writeFileAsync(path.join(dst.toString(), "feed.json"), feed.json1());
}
