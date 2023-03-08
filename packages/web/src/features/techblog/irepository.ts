import { DumpPost, Lang, Post } from "common";

export interface IBlogRepositoy {
  retrive: (uuid: string) => Promise<DumpPost | undefined>;
  list: () => Promise<Post[]>;
  tags: () => Promise<string[]>;
  categories: () => Promise<string[]>;
  filterPosts: (lang?: Lang, tag?: string, category?: string) => Promise<Post[]>;
}
