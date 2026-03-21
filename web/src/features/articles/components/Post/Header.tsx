import { css } from "@/styled-system/css";

import type { PostMeta } from "common";

interface Props {
  className?: string;
  meta: PostMeta;
}

export default function Header({ meta }: Props) {
  return (
    <>
      {meta.tags.includes("archive") ? (
        <div
          className={css({
            bg: "warning.bg",
            color: "warning.text",
            fontSize: "lg",
            textAlign: "center",
            fontWeight: "bold",
            rounded: "lg",
            p: 3,
            mx: 2,
          })}
        >
          この記事はArchiveされています。記事の内容が古い可能性が高いです。
        </div>
      ) : null}

      {meta.tags.includes("draft") ? (
        <div
          className={css({
            bg: "draft.bg",
            color: "draft.text",
            fontSize: "lg",
            textAlign: "center",
            fontWeight: "bold",
            rounded: "lg",
            p: 3,
            mx: 2,
          })}
        >
          この記事はドラフト段階です。
        </div>
      ) : null}

      {meta.tags.includes("ai-generated") ? (
        <div
          className={css({
            bg: "aiGenerated.bg",
            color: "aiGenerated.text",
            fontSize: "lg",
            textAlign: "center",
            fontWeight: "bold",
            rounded: "lg",
            p: 3,
            mx: 2,
          })}
        >
          この記事はAIによって生成されています。内容の正確性にご注意ください。
        </div>
      ) : null}
    </>
  );
}
