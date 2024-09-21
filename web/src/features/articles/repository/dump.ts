import type { PathLike } from "fs";

import type { Dump, DumpPost, Lang } from "common";
import { readDump } from "common/io";
import * as R from "remeda";

import type { IBlogRepository as IBlogRepository } from "../irepository";

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

  async retrieve(uuid: string) {
    const dump = await this.get_dump();
    return dump.posts.filter((post) => post.meta.uuid === uuid).pop();
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
      let ok = true;
      if (lang) ok = lang === post.meta.lang;
      if (tag) ok = post.meta.tags.includes(tag);
      if (category) ok = category === post.meta.category;

      return ok;
    };

    return dump.posts.filter((post) => checkPost(post, lang, tag, category));
  }
}
