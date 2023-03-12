import { DumpPost, Lang } from "common";

export interface IBlogRepositoy {
  retrive: (uuid: string) => Promise<DumpPost | undefined>;
  list: () => Promise<DumpPost[]>;
  tags: () => Promise<string[]>;
  categories: () => Promise<string[]>;
  filterPosts: (lang?: Lang, tag?: string, category?: string) => Promise<DumpPost[]>;
}
