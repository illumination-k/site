import type { PathLike } from "fs";

import type { Dump, DumpPost, Lang } from "common";
import { readDump } from "common/io";
import * as R from "remeda";

import type {
  IBlogRepository as IBlogRepository,
  TagNetworkData,
} from "../irepository";

export default class DumpRepository implements IBlogRepository {
  path: PathLike;
  dump?: Dump;

  constructor(path: PathLike) {
    this.path = path;
  }

  private async get_dump(): Promise<Dump> {
    if (!this.dump) {
      const dump = await readDump(this.path);
      this.dump = dump;
      return dump;
    } else {
      return this.dump;
    }
  }

  async retrieve(uuid: string, lang?: Lang) {
    const dump = await this.get_dump();
    const candidates = dump.posts.filter((post) => post.meta.uuid === uuid);
    if (lang) {
      const langMatch = candidates.find((post) => post.meta.lang === lang);
      if (langMatch) return langMatch;
    }
    return candidates[0];
  }

  async list() {
    const dump = await this.get_dump();
    return dump.posts;
  }

  async categories() {
    const dump = await this.get_dump();
    return dump.categories;
  }

  async tags() {
    const dump = await this.get_dump();
    const defaultTags = ["archive", "draft"];

    const tags = R.pipe(
      dump.tags,
      R.filter((tag) => !defaultTags.includes(tag)),
      R.unique(),
      R.sort((a, b) => a.localeCompare(b)),
    );

    return tags.concat(defaultTags);
  }

  async filterPosts(lang?: Lang, tag?: string, category?: string) {
    const dump = await this.get_dump();

    const checkPost = (
      post: DumpPost,
      lang?: Lang,
      tag?: string,
      category?: string,
    ) => {
      if (lang && post.meta.lang !== lang) return false;
      if (tag && !post.meta.tags.includes(tag)) return false;
      if (category && post.meta.category !== category) return false;
      return true;
    };

    return dump.posts.filter((post) => checkPost(post, lang, tag, category));
  }

  async tagNetwork(lang?: Lang): Promise<TagNetworkData> {
    const dump = await this.get_dump();
    const excludedTags = new Set(["archive", "draft"]);

    const posts = lang
      ? dump.posts.filter((p) => p.meta.lang === lang)
      : dump.posts;

    const tagCount = new Map<string, number>();
    const edgeMap = new Map<string, number>();

    for (const post of posts) {
      const tags = post.meta.tags.filter((t) => !excludedTags.has(t));
      for (const tag of tags) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      }
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const key = [tags[i], tags[j]].sort().join("\0");
          edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
        }
      }
    }

    const nodes = [...tagCount.entries()].map(([tag, count]) => ({
      tag,
      count,
    }));

    const edges = [...edgeMap.entries()].map(([key, weight]) => {
      const [source, target] = key.split("\0");
      return { source, target, weight };
    });

    return { nodes, edges };
  }
}
