import type { DumpPost, Lang } from "common";

export interface TagNetworkNode {
  tag: string;
  count: number;
}

export interface TagNetworkEdge {
  source: string;
  target: string;
  weight: number;
}

export interface TagNetworkData {
  nodes: TagNetworkNode[];
  edges: TagNetworkEdge[];
}

export interface IBlogRepository {
  retrieve: (uuid: string, lang?: Lang) => Promise<DumpPost | undefined>;
  list: () => Promise<DumpPost[]>;
  tags: () => Promise<string[]>;
  categories: () => Promise<string[]>;
  filterPosts: (
    lang?: Lang,
    tag?: string,
    category?: string,
  ) => Promise<DumpPost[]>;
  tagNetwork: (lang?: Lang) => Promise<TagNetworkData>;
}
