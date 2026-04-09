import { css } from "@/styled-system/css";

import {
  BugAntIcon,
  ChatBubbleBottomCenterIcon,
} from "@heroicons/react/24/outline";
import type { PostMeta } from "common";

import GithubIcon from "@/icons/GithubIcon";
import type { Dictionary } from "@/lib/i18n";

interface Props {
  meta: PostMeta;
  dict: Dictionary;
}

const iconClassName = css({ h: 5, w: 5 });

export default function Footer({ meta, dict }: Props) {
  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        mt: 10,
        color: "text.secondary",
      })}
    >
      <p
        className={css({
          display: "flex",
          alignItems: "center",
          gap: 3,
          fontSize: "lg",
          fontWeight: "semibold",
        })}
      >
        <GithubIcon className={iconClassName} />
        {dict.post.githubIssuePrompt}
      </p>
      <ul>
        <li>
          <a
            className={css({
              display: "flex",
              alignItems: "center",
              gap: 2,
              fontSize: "lg",
              color: "accent.primary",
              _hover: { color: "accent.hover" },
            })}
            href="https://github.com/illumination-k/site/issues/new?labels=comment,techblog"
          >
            <ChatBubbleBottomCenterIcon className={iconClassName} />
            Comment
          </a>
        </li>
        <li>
          <a
            className={css({
              display: "flex",
              alignItems: "center",
              gap: 2,
              fontSize: "lg",
              color: "accent.primary",
              _hover: { color: "accent.hover" },
            })}
            href="https://github.com/illumination-k/site/issues/new?labels=bug,techblog"
          >
            <BugAntIcon className={iconClassName} />
            Problem
          </a>
        </li>
      </ul>
    </div>
  );
}
