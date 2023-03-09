import type { PathLike } from "fs";

import { Dump, Lang, Post } from "common";
import { readDump } from "common/io";

import { IBlogRepositoy } from "../irepository";

export default class DumpRepository implements IBlogRepositoy {
  path: PathLike;
  dump?: Dump;

  constructor(path: PathLike) {
    this.path = path;
  }

  private async init() {
    if (!this.dump) {
      this.dump = await readDump(this.path);
    }
  }

  async retrive(
    uuid: string,
  ) {
    await this.init();
    return this.dump!.posts.filter((post) => post.meta.uuid === uuid).pop();
  }

  async list() {
    await this.init();
    return this.dump!.posts;
  }

  async categories() {
    await this.init();
    return this.dump!.categories;
  }

  async tags() {
    await this.init();
    return this.dump!.tags;
  }

  async filterPosts(lang?: Lang, tag?: string, category?: string) {
    await this.init();

    const checkPost = (post: Post, lang?: Lang, tag?: string, category?: string) => {
      let ok = true;
      if (lang) ok = lang === post.meta.lang;
      if (tag) ok = post.meta.tags.includes(tag);
      if (category) ok = category === post.meta.category;

      return ok;
    };

    return this.dump!.posts.filter((post) => checkPost(post, lang, tag, category));
  }
}
