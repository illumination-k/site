import { css } from "@/styled-system/css";

import Tag from "@/features/articles/components/Tag";
import { blogService } from "@/features/techblog/constant";

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
