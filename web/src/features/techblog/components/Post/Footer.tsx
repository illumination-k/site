import GithubIcon from "@/icons/GithubIcon";
import { BugAntIcon, ChatBubbleBottomCenterIcon } from "@heroicons/react/24/outline";
import { PostMeta } from "common";
import { css } from "@/styled-system/css";

type Props = {
  meta: PostMeta;
};

const iconClassName = css({ h: 5, w: 5 });

export default function Footer({ meta }: Props) {
  return (
    <div className={css({display: "flex", alignItems: "center", flexDirection: "column", mt: 10})}
    >
      <p className={css({display: "flex", alignItems: "center", gap: 3, fontSize: "lg", fontWeight: "semibold"})}>
        <GithubIcon className={iconClassName} />
        {meta.lang === "ja"
          ? "この記事に関するIssueをGithubで作成する"
          : "Create a issue on Github about this article"}
      </p>
      <ul>
        <li>
          <a
            className={css({display: "flex", alignItems: "center", gap: 2, fontSize: "lg"})}
            href="https://github.com/illumination-k/site/issues/new?labels=comment,techblog"
          >
            <ChatBubbleBottomCenterIcon className={iconClassName} />
            Comment
          </a>
        </li>
        <li>
          <a
            className={css({display: "flex", alignItems: "center", gap: 2, fontSize: "lg"})}
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
