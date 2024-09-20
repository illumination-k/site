import fs, { type PathLike } from "node:fs";
import { type Author, Feed } from "feed";

import path from "node:path";
import { promisify } from "node:util";
import { readDump } from "common/io";

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
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

  const posts = dump.posts;

  for (const post of posts) {
    const postUrl = `${url}/techblog/post/${post.meta.uuid}`;
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
