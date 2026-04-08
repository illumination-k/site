import { css } from "@/styled-system/css";

import type { PostMeta } from "common";

import type { Dictionary } from "@/lib/i18n";

interface Props {
  className?: string;
  meta: PostMeta;
  dict: Dictionary;
}

export default function Header({ meta, dict }: Props) {
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
          {dict.post.archiveWarning}
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
          {dict.post.draftWarning}
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
          {dict.post.aiGeneratedWarning}
        </div>
      ) : null}
    </>
  );
}
