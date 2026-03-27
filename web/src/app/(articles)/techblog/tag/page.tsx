import { css } from "@/styled-system/css";

import type { Metadata } from "next";

import Tag from "@/features/articles/components/Tag";
import { blogService } from "@/features/techblog/constant";

export const metadata: Metadata = {
  title: "techblog タグ一覧",
  description: "illumination-k.dev のtechblog記事に付けられたタグの一覧",
  openGraph: {
    title: "techblog タグ一覧",
    description: "illumination-k.dev のtechblog記事に付けられたタグの一覧",
    url: "https://www.illumination-k.dev/techblog/tag",
  },
};

export default async function TagPage() {
  const tags = await blogService.repo.tags();

  return (
    <div className={css({ p: 5, display: "flex", flexWrap: "wrap", gap: 3 })}>
      {tags.map((tag) => (
        <Tag key={tag} prefix="techblog" tag={tag} className={css({})} />
      ))}
    </div>
  );
}
